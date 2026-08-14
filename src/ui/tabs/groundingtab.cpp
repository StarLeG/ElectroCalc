// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "groundingtab.h"
#include "core/grounding.h"

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
GroundingTab::GroundingTab(QWidget* p):QWidget(p){
    auto* ml=new QHBoxLayout(this); ml->setContentsMargins(24,24,24,24); ml->setSpacing(24);
    auto* ic=new QFrame(this); ic->setObjectName("Card"); ic->setMinimumWidth(360); ic->setMaximumWidth(420);
    auto* il=new QVBoxLayout(ic); il->setContentsMargins(24,24,24,24); il->setSpacing(16);
    il->addWidget(new QLabel("Исходные данные",ic));
    m_resistivityEdit=new QLineEdit("100",ic); il->addWidget(mkF(ic,"ρ грунта (Ом·м)",m_resistivityEdit));
    m_lengthEdit=new QLineEdit("3",ic); il->addWidget(mkF(ic,"Длина электрода (м)",m_lengthEdit));
    m_diameterEdit=new QLineEdit("0.02",ic); il->addWidget(mkF(ic,"Диаметр электрода (м)",m_diameterEdit));
    m_requiredEdit=new QLineEdit("4",ic); il->addWidget(mkF(ic,"Требуемое R (Ом)",m_requiredEdit));
    il->addSpacing(8);
    auto* br=new QWidget(ic); auto* bl=new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb=new QPushButton("Рассчитать",br); cb->setObjectName("Primary");
    connect(cb,&QPushButton::clicked,this,&GroundingTab::onCalculate); bl->addWidget(cb);
    auto* rb=new QPushButton("Сбросить",br); rb->setObjectName("Ghost");
    connect(rb,&QPushButton::clicked,this,&GroundingTab::onReset); bl->addWidget(rb);
    bl->addStretch(); il->addWidget(br);
    ml->addWidget(ic);

    auto* rc=new QFrame(this); rc->setObjectName("Card");
    auto* rl=new QVBoxLayout(rc); rl->setContentsMargins(24,24,24,24); rl->setSpacing(16);
    rl->addWidget(new QLabel("Результат",rc));
    auto* rd=new QWidget(rc); auto* rdl=new QVBoxLayout(rd);
    rdl->setAlignment(Qt::AlignCenter); rdl->setSpacing(4);
    m_resultResistance=new QLabel("—",rd); m_resultResistance->setObjectName("ResultValue");
    m_resultResistance->setAlignment(Qt::AlignCenter); rdl->addWidget(m_resultResistance);
    auto* u=new QLabel("Ом",rd); u->setObjectName("ResultUnit"); u->setAlignment(Qt::AlignCenter); rdl->addWidget(u);
    auto* d=new QLabel("Сопротивление заземлителя",rd); d->setObjectName("ResultLabel"); d->setAlignment(Qt::AlignCenter); rdl->addWidget(d);
    rl->addWidget(rd);
    auto* grid=new QGridLayout(); grid->setSpacing(12);
    auto* it=new QFrame(rc); it->setStyleSheet("background:#1A1D23;border-radius:8px;");
    auto* il2=new QVBoxLayout(it); il2->setContentsMargins(14,10,14,10); il2->setSpacing(4);
    auto* la=new QLabel("ЧИСЛО ЭЛЕКТРОДОВ",it); la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:0.5px;"); il2->addWidget(la);
    m_detailElectrodes=new QLabel("—",it); m_detailElectrodes->setStyleSheet("font-family:'Consolas',monospace;font-size:18px;font-weight:600;color:#E6EAF0;"); il2->addWidget(m_detailElectrodes);
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
void GroundingTab::onCalculate(){
    bool ok1,ok2,ok3,ok4;
    double rho=m_resistivityEdit->text().toDouble(&ok1);
    double len=m_lengthEdit->text().toDouble(&ok2);
    double dia=m_diameterEdit->text().toDouble(&ok3);
    double req=m_requiredEdit->text().toDouble(&ok4);
    if(!ok1||rho<=0||!ok2||len<=0||!ok3||dia<=0||!ok4||req<=0) return;
    try{
        auto r=Core::GroundingCalculator::singleRod(rho,len,dia);
        int n=Core::GroundingCalculator::selectElectrodeCount(req,r.resistance,0.7);
        m_resultResistance->setText(QString::number(r.resistance,'f',1));
        m_detailElectrodes->setText(QString::number(n));
        m_formulaText->setText("R = ρ/(2πL)·ln(4L/d)");
        m_normativeText->setText(r.normativeRef);
        m_formulaPanel->setVisible(true);
    }catch(...){}
}
void GroundingTab::onReset(){
    m_resistivityEdit->setText("100"); m_lengthEdit->setText("3");
    m_diameterEdit->setText("0.02"); m_requiredEdit->setText("4");
    m_resultResistance->setText("—"); m_detailElectrodes->setText("—");
    m_formulaPanel->setVisible(false);
}
} // namespace Ui
