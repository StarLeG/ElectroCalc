// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "protectiontab.h"
#include "core/protection.h"

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
ProtectionTab::ProtectionTab(QWidget* p):QWidget(p){
    auto* ml=new QHBoxLayout(this); ml->setContentsMargins(24,24,24,24); ml->setSpacing(24);
    auto* ic=new QFrame(this); ic->setObjectName("Card"); ic->setMinimumWidth(360); ic->setMaximumWidth(420);
    auto* il=new QVBoxLayout(ic); il->setContentsMargins(24,24,24,24); il->setSpacing(16);
    il->addWidget(new QLabel("Исходные данные",ic));
    m_loadCurrentEdit=new QLineEdit("16",ic); il->addWidget(mkF(ic,"Ток нагрузки (А)",m_loadCurrentEdit));
    m_characteristicCombo=new QComboBox(ic);
    m_characteristicCombo->addItem("B (магнитный 3–5·In)");
    m_characteristicCombo->addItem("C (магнитный 5–10·In)");
    m_characteristicCombo->addItem("D (магнитный 10–20·In)");
    m_characteristicCombo->setCurrentIndex(1);
    il->addWidget(mkF(ic,"Характеристика автомата",m_characteristicCombo));
    m_leakageEdit=new QLineEdit("30",ic); il->addWidget(mkF(ic,"Ток утечки (мА)",m_leakageEdit));
    m_upstreamEdit=new QLineEdit("63",ic); il->addWidget(mkF(ic,"Ток вводного автомата (А)",m_upstreamEdit));
    il->addSpacing(8);
    auto* br=new QWidget(ic); auto* bl=new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb=new QPushButton("Рассчитать",br); cb->setObjectName("Primary");
    connect(cb,&QPushButton::clicked,this,&ProtectionTab::onCalculate); bl->addWidget(cb);
    auto* rb=new QPushButton("Сбросить",br); rb->setObjectName("Ghost");
    connect(rb,&QPushButton::clicked,this,&ProtectionTab::onReset); bl->addWidget(rb);
    bl->addStretch(); il->addWidget(br);
    ml->addWidget(ic);

    auto* rc=new QFrame(this); rc->setObjectName("Card");
    auto* rl=new QVBoxLayout(rc); rl->setContentsMargins(24,24,24,24); rl->setSpacing(16);
    rl->addWidget(new QLabel("Результат",rc));
    auto* rd=new QWidget(rc); auto* rdl=new QVBoxLayout(rd);
    rdl->setAlignment(Qt::AlignCenter); rdl->setSpacing(4);
    m_resultBreaker=new QLabel("—",rd); m_resultBreaker->setObjectName("ResultValue");
    m_resultBreaker->setAlignment(Qt::AlignCenter); rdl->addWidget(m_resultBreaker);
    auto* u=new QLabel("Ампер",rd); u->setObjectName("ResultUnit"); u->setAlignment(Qt::AlignCenter); rdl->addWidget(u);
    auto* d=new QLabel("Номинальный ток автомата",rd); d->setObjectName("ResultLabel"); d->setAlignment(Qt::AlignCenter); rdl->addWidget(d);
    rl->addWidget(rd);
    auto* grid=new QGridLayout(); grid->setSpacing(12);
    auto mkD=[&](const QString& lb,int r,int col)->QLabel*{
        auto* it=new QFrame(rc); it->setStyleSheet("background:#1A1D23;border-radius:8px;");
        auto* il2=new QVBoxLayout(it); il2->setContentsMargins(14,10,14,10); il2->setSpacing(4);
        auto* la=new QLabel(lb,it); la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:0.5px;"); il2->addWidget(la);
        auto* va=new QLabel("—",it); va->setStyleSheet("font-family:'Consolas',monospace;font-size:18px;font-weight:600;color:#E6EAF0;"); il2->addWidget(va);
        grid->addWidget(it,r,col); return va;
    };
    m_detailRCD=mkD("НОМИНАЛ УЗО (мА)",0,0);
    m_detailSelectivity=mkD("СЕЛЕКТИВНОСТЬ",0,1);
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
void ProtectionTab::onCalculate(){
    bool ok1,ok2,ok3;
    double loadI=m_loadCurrentEdit->text().toDouble(&ok1);
    double leakage=m_leakageEdit->text().toDouble(&ok2);
    double upstream=m_upstreamEdit->text().toDouble(&ok3);
    if(!ok1||loadI<=0||!ok2||leakage<=0||!ok3||upstream<=0) return;
    QString ch; int ci=m_characteristicCombo->currentIndex();
    ch=(ci==0)?"B":(ci==1)?"C":"D";
    try{
        double breaker=Core::ProtectionCalculator::selectBreaker(loadI,ch);
        double rcd=Core::ProtectionCalculator::selectRCD(leakage);
        bool sel=Core::ProtectionCalculator::checkSelectivity(upstream,breaker);
        m_resultBreaker->setText(QString::number(breaker,'f',0));
        m_detailRCD->setText(QString::number(rcd,'f',0));
        m_detailSelectivity->setText(sel?"✓ Обеспечена":"✗ Не обеспечена");
        m_formulaText->setText("Iавт ≥ Iнагр · kзап");
        m_normativeText->setText("ПУЭ п. 1.7.79 — выбор автоматического выключателя");
        m_formulaPanel->setVisible(true);
    }catch(...){}
}
void ProtectionTab::onReset(){
    m_loadCurrentEdit->setText("16"); m_characteristicCombo->setCurrentIndex(1);
    m_leakageEdit->setText("30"); m_upstreamEdit->setText("63");
    m_resultBreaker->setText("—"); m_detailRCD->setText("—");
    m_detailSelectivity->setText("—"); m_formulaPanel->setVisible(false);
}
} // namespace Ui
