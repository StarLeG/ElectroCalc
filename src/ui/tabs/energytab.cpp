// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "energytab.h"
#include "core/energy.h"

#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>
#include <QFrame>
namespace Ui {
static QWidget* mkF(QWidget* p, const QString& lb, QWidget* w) {
    auto* g=new QWidget(p); auto* l=new QVBoxLayout(g);
    l->setContentsMargins(0,0,0,0); l->setSpacing(6);
    auto* la=new QLabel(lb,g); la->setStyleSheet("font-size:13px;font-weight:600;color:#9AA4B2;");
    l->addWidget(la); l->addWidget(w); return g;
}
EnergyTab::EnergyTab(QWidget* p):QWidget(p){
    auto* ml=new QHBoxLayout(this); ml->setContentsMargins(24,24,24,24); ml->setSpacing(24);
    auto* ic=new QFrame(this); ic->setObjectName("Card"); ic->setMinimumWidth(360); ic->setMaximumWidth(420);
    auto* il=new QVBoxLayout(ic); il->setContentsMargins(24,24,24,24); il->setSpacing(16);
    il->addWidget(new QLabel("Исходные данные",ic));
    m_powerEdit=new QLineEdit("2.2",ic); il->addWidget(mkF(ic,"Мощность (кВт)",m_powerEdit));
    m_timeEdit=new QLineEdit("8",ic); il->addWidget(mkF(ic,"Время работы (ч)",m_timeEdit));
    m_tariffEdit=new QLineEdit("0.5",ic); il->addWidget(mkF(ic,"Тариф (руб./кВт·ч)",m_tariffEdit));
    m_daysEdit=new QLineEdit("30",ic); il->addWidget(mkF(ic,"Количество дней",m_daysEdit));
    il->addSpacing(8);
    auto* br=new QWidget(ic); auto* bl=new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb=new QPushButton("Рассчитать",br); cb->setObjectName("Primary");
    connect(cb,&QPushButton::clicked,this,&EnergyTab::onCalculate); bl->addWidget(cb);
    auto* rb=new QPushButton("Сбросить",br); rb->setObjectName("Ghost");
    connect(rb,&QPushButton::clicked,this,&EnergyTab::onReset); bl->addWidget(rb);
    bl->addStretch(); il->addWidget(br);
    ml->addWidget(ic);

    auto* rc=new QFrame(this); rc->setObjectName("Card");
    auto* rl=new QVBoxLayout(rc); rl->setContentsMargins(24,24,24,24); rl->setSpacing(16);
    rl->addWidget(new QLabel("Результат",rc));
    auto* rd=new QWidget(rc); auto* rdl=new QVBoxLayout(rd);
    rdl->setAlignment(Qt::AlignCenter); rdl->setSpacing(4);
    m_resultKWh=new QLabel("—",rd); m_resultKWh->setObjectName("ResultValue");
    m_resultKWh->setAlignment(Qt::AlignCenter); rdl->addWidget(m_resultKWh);
    auto* u=new QLabel("кВт·ч",rd); u->setObjectName("ResultUnit"); u->setAlignment(Qt::AlignCenter); rdl->addWidget(u);
    auto* d=new QLabel("Потреблённая энергия",rd); d->setObjectName("ResultLabel"); d->setAlignment(Qt::AlignCenter); rdl->addWidget(d);
    rl->addWidget(rd);
    auto* grid=new QGridLayout(); grid->setSpacing(12);
    auto mkD=[&](const QString& lb,int r,int col)->QLabel*{
        auto* it=new QFrame(rc); it->setStyleSheet("background:#1A1D23;border-radius:8px;");
        auto* il2=new QVBoxLayout(it); il2->setContentsMargins(14,10,14,10); il2->setSpacing(4);
        auto* la=new QLabel(lb,it); la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:0.5px;"); il2->addWidget(la);
        auto* va=new QLabel("—",it); va->setStyleSheet("font-family:'Consolas',monospace;font-size:18px;font-weight:600;color:#E6EAF0;"); il2->addWidget(va);
        grid->addWidget(it,r,col); return va;
    };
    m_detailJoules=mkD("ДЖОУЛЕЙ",0,0);
    m_detailCost=mkD("СТОИМОСТЬ (РУБ.)",0,1);
    rl->addLayout(grid);
    m_formulaPanel=new QFrame(rc);
    m_formulaPanel->setStyleSheet("background:#2E343F;border:1px solid #3A414D;border-radius:8px;padding:14px;");
    m_formulaPanel->setVisible(false);
    auto* fl=new QVBoxLayout(m_formulaPanel); fl->setSpacing(6);
    auto* ft=new QLabel("ФОРМУЛА И НОРМАТИВ",m_formulaPanel); ft->setStyleSheet("font-size:11px;font-weight:600;color:#9AA4B2;letter-spacing:0.5px;"); fl->addWidget(ft);
    m_formulaText=new QLabel("",m_formulaPanel); m_formulaText->setStyleSheet("font-family:'Consolas',monospace;font-size:15px;color:#38BDF8;"); fl->addWidget(m_formulaText);
    m_normativeText=new QLabel("",m_formulaPanel); m_normativeText->setStyleSheet("font-size:12px;color:#9AA4B2;font-style:italic;"); fl->addWidget(m_normativeText);
    rl->addWidget(m_formulaPanel); rl->addStretch();
    ml->addWidget(rc);
    onCalculate();
}
void EnergyTab::onCalculate(){
    bool ok1,ok2,ok3,ok4;
    double P=m_powerEdit->text().toDouble(&ok1);
    double t=m_timeEdit->text().toDouble(&ok2);
    double tariff=m_tariffEdit->text().toDouble(&ok3);
    int days=m_daysEdit->text().toInt(&ok4);
    if(!ok1||P<0||!ok2||t<0||!ok3||tariff<0||!ok4||days<0) return;
    try{
        auto r=Core::EnergyCalculator::energyKWh(P,t);
        double cost=Core::EnergyCalculator::cost(r.energyKWh,tariff,days);
        m_resultKWh->setText(QString::number(r.energyKWh,'f',2));
        m_detailJoules->setText(QString::number(r.energyJoules,'f',0));
        m_detailCost->setText(QString::number(cost,'f',2));
        m_formulaText->setText("E = P · t");
        m_normativeText->setText(r.normativeRef);
        m_formulaPanel->setVisible(true);
    }catch(...){}
}
void EnergyTab::onReset(){
    m_powerEdit->setText("2.2"); m_timeEdit->setText("8");
    m_tariffEdit->setText("0.5"); m_daysEdit->setText("30");
    m_resultKWh->setText("—"); m_detailJoules->setText("—");
    m_detailCost->setText("—"); m_formulaPanel->setVisible(false);
}
} // namespace Ui
