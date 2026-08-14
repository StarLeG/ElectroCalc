// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "thermaltab.h"
#include "core/thermal.h"

#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QLabel>
#include <QLineEdit>
#include <QComboBox>
#include <QPushButton>
#include <QFrame>
namespace Ui {
static QWidget* mkF(QWidget* p, const QString& lb, QWidget* w) {
    auto* g=new QWidget(p); auto* l=new QVBoxLayout(g);
    l->setContentsMargins(0,0,0,0); l->setSpacing(6);
    auto* la=new QLabel(lb,g); la->setStyleSheet("font-size:13px;font-weight:600;color:#9AA4B2;");
    l->addWidget(la); l->addWidget(w); return g;
}
ThermalTab::ThermalTab(QWidget* p):QWidget(p){
    auto* ml=new QHBoxLayout(this); ml->setContentsMargins(24,24,24,24); ml->setSpacing(24);
    auto* ic=new QFrame(this); ic->setObjectName("Card"); ic->setMinimumWidth(360); ic->setMaximumWidth(420);
    auto* il=new QVBoxLayout(ic); il->setContentsMargins(24,24,24,24); il->setSpacing(16);
    il->addWidget(new QLabel("Исходные данные",ic));
    m_currentEdit=new QLineEdit("10",ic); il->addWidget(mkF(ic,"Ток (А)",m_currentEdit));
    m_resistanceEdit=new QLineEdit("0.1",ic); il->addWidget(mkF(ic,"Сопротивление (Ом)",m_resistanceEdit));
    m_timeEdit=new QLineEdit("60",ic); il->addWidget(mkF(ic,"Время (с)",m_timeEdit));
    auto* row=new QWidget(ic); auto* rl=new QHBoxLayout(row);
    rl->setContentsMargins(0,0,0,0); rl->setSpacing(12);
    m_materialCombo=new QComboBox(row); m_materialCombo->addItem("Медь (Cu)"); m_materialCombo->addItem("Алюминий (Al)");
    rl->addWidget(mkF(row,"Материал",m_materialCombo));
    m_sectionEdit=new QLineEdit("4",row); rl->addWidget(mkF(row,"Сечение (мм²)",m_sectionEdit));
    il->addWidget(row);
    il->addSpacing(8);
    auto* br=new QWidget(ic); auto* bl=new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb=new QPushButton("Рассчитать",br); cb->setObjectName("Primary");
    connect(cb,&QPushButton::clicked,this,&ThermalTab::onCalculate); bl->addWidget(cb);
    auto* rb=new QPushButton("Сбросить",br); rb->setObjectName("Ghost");
    connect(rb,&QPushButton::clicked,this,&ThermalTab::onReset); bl->addWidget(rb);
    bl->addStretch(); il->addWidget(br);
    ml->addWidget(ic);

    auto* rc=new QFrame(this); rc->setObjectName("Card");
    auto* rl2=new QVBoxLayout(rc); rl2->setContentsMargins(24,24,24,24); rl2->setSpacing(16);
    rl2->addWidget(new QLabel("Результат",rc));
    auto* rd=new QWidget(rc); auto* rdl=new QVBoxLayout(rd);
    rdl->setAlignment(Qt::AlignCenter); rdl->setSpacing(4);
    m_resultHeat=new QLabel("—",rd); m_resultHeat->setObjectName("ResultValue");
    m_resultHeat->setAlignment(Qt::AlignCenter); rdl->addWidget(m_resultHeat);
    auto* u=new QLabel("Джоулей",rd); u->setObjectName("ResultUnit"); u->setAlignment(Qt::AlignCenter); rdl->addWidget(u);
    auto* d=new QLabel("Количество теплоты",rd); d->setObjectName("ResultLabel"); d->setAlignment(Qt::AlignCenter); rdl->addWidget(d);
    rl2->addWidget(rd);
    auto* grid=new QGridLayout(); grid->setSpacing(12);
    auto* it=new QFrame(rc); it->setStyleSheet("background:#1A1D23;border-radius:8px;");
    auto* il2=new QVBoxLayout(it); il2->setContentsMargins(14,10,14,10); il2->setSpacing(4);
    auto* la=new QLabel("ТОК ПЛАВКИ",it); la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:0.5px;"); il2->addWidget(la);
    m_detailMelting=new QLabel("—",it); m_detailMelting->setStyleSheet("font-family:'Consolas',monospace;font-size:18px;font-weight:600;color:#E6EAF0;"); il2->addWidget(m_detailMelting);
    grid->addWidget(it,0,0); rl2->addLayout(grid);
    m_formulaPanel=new QFrame(rc);
    m_formulaPanel->setStyleSheet("background:#2E343F;border:1px solid #3A414D;border-radius:8px;padding:14px;");
    m_formulaPanel->setVisible(false);
    auto* fl=new QVBoxLayout(m_formulaPanel); fl->setSpacing(6);
    auto* ft=new QLabel("ФОРМУЛА И НОРМАТИВ",m_formulaPanel); ft->setStyleSheet("font-size:11px;font-weight:600;color:#9AA4B2;letter-spacing:0.5px;"); fl->addWidget(ft);
    m_formulaText=new QLabel("",m_formulaPanel); m_formulaText->setStyleSheet("font-family:'Consolas',monospace;font-size:15px;color:#38BDF8;"); fl->addWidget(m_formulaText);
    m_normativeText=new QLabel("",m_formulaPanel); m_normativeText->setStyleSheet("font-size:12px;color:#9AA4B2;font-style:italic;"); fl->addWidget(m_normativeText);
    rl2->addWidget(m_formulaPanel); rl2->addStretch();
    ml->addWidget(rc);
}
void ThermalTab::onCalculate(){
    bool ok1,ok2,ok3,ok4;
    double I=m_currentEdit->text().toDouble(&ok1);
    double R=m_resistanceEdit->text().toDouble(&ok2);
    double t=m_timeEdit->text().toDouble(&ok3);
    double S=m_sectionEdit->text().toDouble(&ok4);
    if(!ok1||I<=0||!ok2||R<0||!ok3||t<=0||!ok4||S<=0) return;
    QString mat=m_materialCombo->currentIndex()==0?"Cu":"Al";
    try{
        auto r=Core::ThermalCalculator::heatGeneration(I,R,t);
        double melt=Core::ThermalCalculator::meltingCurrent(S,mat,1.0);
        m_resultHeat->setText(QString::number(r.heat,'f',0));
        m_detailMelting->setText(QString("%1 А").arg(melt,0,'f',0));
        m_formulaText->setText("Q = I²·R·t");
        m_normativeText->setText(r.normativeRef);
        m_formulaPanel->setVisible(true);
    }catch(...){}
}
void ThermalTab::onReset(){
    m_currentEdit->setText("10"); m_resistanceEdit->setText("0.1");
    m_timeEdit->setText("60"); m_sectionEdit->setText("4");
    m_resultHeat->setText("—"); m_detailMelting->setText("—");
    m_formulaPanel->setVisible(false);
}
} // namespace Ui
