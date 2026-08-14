// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "shortcircuittab.h"
#include "core/short_circuit.h"

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
ShortCircuitTab::ShortCircuitTab(QWidget* p):QWidget(p){
    auto* ml=new QHBoxLayout(this); ml->setContentsMargins(24,24,24,24); ml->setSpacing(24);
    auto* ic=new QFrame(this); ic->setObjectName("Card"); ic->setMinimumWidth(360); ic->setMaximumWidth(420);
    auto* il=new QVBoxLayout(ic); il->setContentsMargins(24,24,24,24); il->setSpacing(16);
    il->addWidget(new QLabel("Исходные данные",ic));
    m_voltageEdit=new QLineEdit("380",ic); il->addWidget(mkF(ic,"Линейное напряжение (В)",m_voltageEdit));
    m_impedanceEdit=new QLineEdit("0.1",ic); il->addWidget(mkF(ic,"Полное сопротивление (Ом)",m_impedanceEdit));
    il->addSpacing(8);
    auto* br=new QWidget(ic); auto* bl=new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb=new QPushButton("Рассчитать",br); cb->setObjectName("Primary");
    connect(cb,&QPushButton::clicked,this,&ShortCircuitTab::onCalculate); bl->addWidget(cb);
    auto* rb=new QPushButton("Сбросить",br); rb->setObjectName("Ghost");
    connect(rb,&QPushButton::clicked,this,&ShortCircuitTab::onReset); bl->addWidget(rb);
    bl->addStretch(); il->addWidget(br);
    ml->addWidget(ic);

    auto* rc=new QFrame(this); rc->setObjectName("Card");
    auto* rl=new QVBoxLayout(rc); rl->setContentsMargins(24,24,24,24); rl->setSpacing(16);
    rl->addWidget(new QLabel("Результат",rc));
    auto* rd=new QWidget(rc); auto* rdl=new QVBoxLayout(rd);
    rdl->setAlignment(Qt::AlignCenter); rdl->setSpacing(4);
    m_resultCurrent=new QLabel("—",rd); m_resultCurrent->setObjectName("ResultValue");
    m_resultCurrent->setAlignment(Qt::AlignCenter); rdl->addWidget(m_resultCurrent);
    auto* u=new QLabel("Ампер",rd); u->setObjectName("ResultUnit"); u->setAlignment(Qt::AlignCenter); rdl->addWidget(u);
    auto* d=new QLabel("Ток короткого замыкания",rd); d->setObjectName("ResultLabel"); d->setAlignment(Qt::AlignCenter); rdl->addWidget(d);
    rl->addWidget(rd);
    auto* grid=new QGridLayout(); grid->setSpacing(12);
    auto* it=new QFrame(rc); it->setStyleSheet("background:#1A1D23;border-radius:8px;");
    auto* il2=new QVBoxLayout(it); il2->setContentsMargins(14,10,14,10); il2->setSpacing(4);
    auto* la=new QLabel("ПОЛНОЕ СОПРОТИВЛЕНИЕ",it); la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:0.5px;"); il2->addWidget(la);
    m_detailImpedance=new QLabel("—",it); m_detailImpedance->setStyleSheet("font-family:'Consolas',monospace;font-size:18px;font-weight:600;color:#E6EAF0;"); il2->addWidget(m_detailImpedance);
    grid->addWidget(it,0,0); rl->addLayout(grid);
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
void ShortCircuitTab::onCalculate(){
    bool ok1,ok2; double U=m_voltageEdit->text().toDouble(&ok1); double Z=m_impedanceEdit->text().toDouble(&ok2);
    if(!ok1||U<=0||!ok2||Z<=0) return;
    try{
        auto r=Core::ShortCircuitCalculator::calculate(U,Z);
        m_resultCurrent->setText(QString::number(r.current,'f',0));
        m_detailImpedance->setText(QString("%1 Ом").arg(Z,0,'f',3));
        m_formulaText->setText("Iкз = U / (√3 × Z)");
        m_normativeText->setText(r.normativeRef);
        m_formulaPanel->setVisible(true);
    }catch(...){}
}
void ShortCircuitTab::onReset(){
    m_voltageEdit->setText("380"); m_impedanceEdit->setText("0.1");
    m_resultCurrent->setText("—"); m_detailImpedance->setText("—");
    m_formulaPanel->setVisible(false);
}
} // namespace Ui
