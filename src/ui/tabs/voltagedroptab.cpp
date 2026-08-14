// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "voltagedroptab.h"
#include "core/voltage_drop.h"

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
VoltageDropTab::VoltageDropTab(QWidget* p):QWidget(p){
    auto* ml=new QHBoxLayout(this); ml->setContentsMargins(24,24,24,24); ml->setSpacing(24);
    auto* ic=new QFrame(this); ic->setObjectName("Card"); ic->setMinimumWidth(360); ic->setMaximumWidth(420);
    auto* il=new QVBoxLayout(ic); il->setContentsMargins(24,24,24,24); il->setSpacing(16);
    setupInput(ic,il); ml->addWidget(ic);
    auto* rc=new QFrame(this); rc->setObjectName("Card");
    auto* rl=new QVBoxLayout(rc); rl->setContentsMargins(24,24,24,24); rl->setSpacing(16);
    setupResult(rc,rl); ml->addWidget(rc);
    onCalculate();
}
void VoltageDropTab::setupInput(QWidget* c, QVBoxLayout* l){
    l->addWidget(new QLabel("Исходные данные",c));
    m_currentEdit=new QLineEdit("10",c); l->addWidget(mkF(c,"Ток (А)",m_currentEdit));
    m_lengthEdit=new QLineEdit("100",c); l->addWidget(mkF(c,"Длина линии (м)",m_lengthEdit));
    m_resistanceEdit=new QLineEdit("7.24",c); l->addWidget(mkF(c,"R (Ом/км)",m_resistanceEdit));
    m_reactanceEdit=new QLineEdit("0.08",c); l->addWidget(mkF(c,"X (Ом/км)",m_reactanceEdit));
    auto* row=new QWidget(c); auto* rl=new QHBoxLayout(row);
    rl->setContentsMargins(0,0,0,0); rl->setSpacing(12);
    m_voltageEdit=new QLineEdit("380",row); rl->addWidget(mkF(row,"U (В)",m_voltageEdit));
    m_cosPhiEdit=new QLineEdit("0.85",row); rl->addWidget(mkF(row,"cos φ",m_cosPhiEdit));
    l->addWidget(row);
    l->addSpacing(8);
    auto* br=new QWidget(c); auto* bl=new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb=new QPushButton("Рассчитать",br); cb->setObjectName("Primary");
    connect(cb,&QPushButton::clicked,this,&VoltageDropTab::onCalculate); bl->addWidget(cb);
    auto* rb=new QPushButton("Сбросить",br); rb->setObjectName("Ghost");
    connect(rb,&QPushButton::clicked,this,&VoltageDropTab::onReset); bl->addWidget(rb);
    bl->addStretch(); l->addWidget(br);
}
void VoltageDropTab::setupResult(QWidget* c, QVBoxLayout* l){
    l->addWidget(new QLabel("Результат",c));
    auto* rd=new QWidget(c); auto* rdl=new QVBoxLayout(rd);
    rdl->setAlignment(Qt::AlignCenter); rdl->setSpacing(4);
    m_resultVolts=new QLabel("—",rd); m_resultVolts->setObjectName("ResultValue");
    m_resultVolts->setAlignment(Qt::AlignCenter); rdl->addWidget(m_resultVolts);
    auto* u=new QLabel("Вольт",rd); u->setObjectName("ResultUnit"); u->setAlignment(Qt::AlignCenter); rdl->addWidget(u);
    auto* d=new QLabel("Падение напряжения",rd); d->setObjectName("ResultLabel"); d->setAlignment(Qt::AlignCenter); rdl->addWidget(d);
    l->addWidget(rd);
    auto* grid=new QGridLayout(); grid->setSpacing(12);
    auto mkD=[&](const QString& lb,int r,int col)->QLabel*{
        auto* it=new QFrame(c); it->setStyleSheet("background:#1A1D23;border-radius:8px;");
        auto* il2=new QVBoxLayout(it); il2->setContentsMargins(14,10,14,10); il2->setSpacing(4);
        auto* la=new QLabel(lb,it); la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:0.5px;");
        il2->addWidget(la);
        auto* va=new QLabel("—",it); va->setStyleSheet("font-family:'Consolas',monospace;font-size:18px;font-weight:600;color:#E6EAF0;");
        il2->addWidget(va); grid->addWidget(it,r,col); return va;
    };
    m_resultPercent=mkD("ПАДЕНИЕ (%)",0,0);
    m_detailDropVolts=mkD("ПАДЕНИЕ (В)",0,1);
    l->addLayout(grid);
    m_formulaPanel=new QFrame(c);
    m_formulaPanel->setStyleSheet("background:#2E343F;border:none;border-radius:8px;padding:14px;");
    m_formulaPanel->setVisible(false);
    auto* fl=new QVBoxLayout(m_formulaPanel); fl->setSpacing(6);
    auto* ft=new QLabel("ФОРМУЛА И НОРМАТИВ",m_formulaPanel);
    ft->setStyleSheet("font-size:11px;font-weight:600;color:#9AA4B2;letter-spacing:0.5px;"); fl->addWidget(ft);
    m_formulaText=new QLabel("",m_formulaPanel);
    m_formulaText->setStyleSheet("font-family:'Consolas',monospace;font-size:15px;color:#38BDF8;"); fl->addWidget(m_formulaText);
    m_normativeText=new QLabel("",m_formulaPanel);
    m_normativeText->setStyleSheet("font-size:12px;color:#9AA4B2;font-style:italic;"); fl->addWidget(m_normativeText);
    l->addWidget(m_formulaPanel); l->addStretch();
}
void VoltageDropTab::onCalculate(){
    bool ok1,ok2,ok3,ok4,ok5,ok6;
    double I=m_currentEdit->text().toDouble(&ok1);
    double L=m_lengthEdit->text().toDouble(&ok2);
    double R=m_resistanceEdit->text().toDouble(&ok3);
    double X=m_reactanceEdit->text().toDouble(&ok4);
    double U=m_voltageEdit->text().toDouble(&ok5);
    double cos=m_cosPhiEdit->text().toDouble(&ok6);
    if(!ok1||I<=0||!ok2||L<=0||!ok3||R<0||!ok4||X<0||!ok5||U<=0||!ok6||cos<0.1||cos>1.0) return;

    // ΔU = √3 * I * L * (R·cosφ + X·sinφ) / 1000
    double sqrt3 = std::sqrt(3.0);
    double sinPhi = std::sqrt(1.0 - cos * cos);
    double dropVolts = sqrt3 * I * L * (R * cos + X * sinPhi) / 1000.0;
    double dropPercent = (dropVolts / U) * 100.0;

    m_resultVolts->setText(QString("%1 В").arg(dropVolts, 0, 'f', 1));
    m_resultPercent->setText(QString("%1 %").arg(dropPercent, 0, 'f', 2));
    m_detailDropVolts->setText(QString("%1 В").arg(dropVolts, 0, 'f', 1));
    m_formulaText->setText("ΔU = √3·I·L·(R·cosφ+X·sinφ)/1000");
    m_normativeText->setText("ПУЭ п. 1.3.10 — потери напряжения");
    m_formulaPanel->setVisible(true);
}
void VoltageDropTab::onReset(){
    m_currentEdit->setText("10"); m_lengthEdit->setText("100");
    m_resistanceEdit->setText("7.24"); m_reactanceEdit->setText("0.08");
    m_voltageEdit->setText("380"); m_cosPhiEdit->setText("0.85");
    m_resultVolts->setText("—"); m_resultPercent->setText("—");
    m_detailDropVolts->setText("—"); m_formulaPanel->setVisible(false);
}
} // namespace Ui
