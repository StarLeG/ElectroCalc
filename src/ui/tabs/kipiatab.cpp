// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "kipiatab.h"
#include "kipia/currentloop.h"
#include "kipia/signalscaling.h"
#include "kipia/rtd.h"
#include "kipia/pidtuning.h"
#include "kipia/accuracy.h"

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QGridLayout>
#include <QTabWidget>
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>
#include <QFrame>
#include <QComboBox>

namespace Ui {

static QWidget* mkF(QWidget* p, const QString& lb, QWidget* w) {
    auto* g=new QWidget(p); auto* l=new QVBoxLayout(g);
    l->setContentsMargins(0,0,0,0); l->setSpacing(6);
    auto* la=new QLabel(lb,g); la->setStyleSheet("font-size:13px;font-weight:600;color:#9AA4B2;");
    l->addWidget(la); l->addWidget(w); return g;
}

KipiaTab::KipiaTab(QWidget* p) : QWidget(p) {
    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(24,24,24,24);

    auto* tabs = new QTabWidget(this);
    setupCurrentLoop(this, tabs);
    setupScaling(this, tabs);
    setupRtd(this, tabs);
    setupPid(this, tabs);
    setupAccuracy(this, tabs);
    layout->addWidget(tabs);
}

void KipiaTab::setupCurrentLoop(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page); ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("Токовая петля 4–20 мА", ic));

    auto* supE = new QLineEdit("24", ic); il->addWidget(mkF(ic, "Напряжение питания (В)", supE));
    auto* minE = new QLineEdit("10", ic); il->addWidget(mkF(ic, "Мин. напряжение прибора (В)", minE));
    auto* wireE = new QLineEdit("20", ic); il->addWidget(mkF(ic, "R проводов (Ом)", wireE));
    auto* devE = new QLineEdit("250", ic); il->addWidget(mkF(ic, "R прибора (Ом)", devE));
    auto* barE = new QLineEdit("0", ic); il->addWidget(mkF(ic, "R барьера (Ом)", barE));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    auto* rb = new QPushButton("Сбросить", br); rb->setObjectName("Ghost");
    bl->addWidget(cb); bl->addWidget(rb); bl->addStretch();
    il->addSpacing(8); il->addWidget(br); ml->addWidget(ic);

    auto* rc = new QFrame(page); rc->setObjectName("Card");
    auto* rl = new QVBoxLayout(rc); rl->setContentsMargins(20,20,20,20); rl->setSpacing(12);
    rl->addWidget(new QLabel("Результат", rc));
    rl->addWidget(resultL);
    auto* grid = new QGridLayout(); grid->setSpacing(8);
    auto mkD=[&](const QString& lb,int r,int col)->QLabel*{
        auto* it=new QFrame(rc); it->setStyleSheet("background:#1A1D23;border-radius:8px;");
        auto* il2=new QVBoxLayout(it); il2->setContentsMargins(12,8,12,8); il2->setSpacing(4);
        auto* la=new QLabel(lb,it); la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;"); il2->addWidget(la);
        auto* va=new QLabel("—",it); va->setStyleSheet("font-family:'Consolas',monospace;font-size:16px;font-weight:600;color:#E6EAF0;"); il2->addWidget(va);
        grid->addWidget(it,r,col); return va;
    };
    auto* dRmax = mkD("МАКС. R (Ом)",0,0);
    auto* dRtotal = mkD("R СУММАРНОЕ (Ом)",0,1);
    auto* dVdrop = mkD("ПАДЕНИЕ (В)",1,0);
    auto* dValid = mkD("СТАТУС",1,1);
    rl->addLayout(grid); rl->addStretch(); ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok1,ok2,ok3,ok4,ok5;
        double sup=supE->text().toDouble(&ok1); double min=minE->text().toDouble(&ok2);
        double wire=wireE->text().toDouble(&ok3); double dev=devE->text().toDouble(&ok4);
        double bar=barE->text().toDouble(&ok5);
        if(!ok1||sup<=0||!ok2||min<0||!ok3||wire<0||!ok4||dev<0||!ok5||bar<0) return;
        try {
            auto r=Kipia::CurrentLoopCalculator::calculate(sup,min,wire,dev,bar);
            resultL->setText(r.isValid ? "✓ Петля валидна" : "✗ Превышено сопротивление");
            resultL->setStyleSheet(r.isValid ?
                "font-size:18px;font-weight:600;color:#22E88A;" :
                "font-size:18px;font-weight:600;color:#FF5D5D;");
            dRmax->setText(QString("%1 Ом").arg(r.maxResistance,0,'f',0));
            dRtotal->setText(QString("%1 Ом").arg(r.totalResistance,0,'f',0));
            dVdrop->setText(QString("%1 В").arg(r.voltageDrop,0,'f',2));
            dValid->setText(r.isValid ? "OK" : "FAIL");
        } catch(...) {}
    });

    connect(rb, &QPushButton::clicked, this, [=]() {
        supE->setText("24"); minE->setText("10"); wireE->setText("20"); devE->setText("250"); barE->setText("0");
        resultL->setText("—"); resultL->setStyleSheet("font-size:32px;font-weight:700;color:#22E88A;");
        dRmax->setText("—"); dRtotal->setText("—"); dVdrop->setText("—"); dValid->setText("—");
    });

    tabs->addTab(page, "Токовая петля");
}

void KipiaTab::setupScaling(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page); ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("Масштабирование сигнала", ic));

    auto* sigE = new QLineEdit("12", ic); il->addWidget(mkF(ic, "Сигнал (мА)", sigE));
    auto* sigMinE = new QLineEdit("4", ic); il->addWidget(mkF(ic, "Мин. сигнал (мА)", sigMinE));
    auto* sigMaxE = new QLineEdit("20", ic); il->addWidget(mkF(ic, "Макс. сигнал (мА)", sigMaxE));
    auto* lrvE = new QLineEdit("0", ic); il->addWidget(mkF(ic, "LRV (нижний предел)", lrvE));
    auto* urvE = new QLineEdit("100", ic); il->addWidget(mkF(ic, "URV (верхний предел)", urvE));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    bl->addWidget(cb); bl->addStretch();
    il->addSpacing(8); il->addWidget(br); ml->addWidget(ic);

    auto* rc = new QFrame(page); rc->setObjectName("Card");
    auto* rl = new QVBoxLayout(rc); rl->setContentsMargins(20,20,20,20); rl->setSpacing(12);
    rl->addWidget(new QLabel("Результат", rc));
    rl->addWidget(resultL);
    rl->addStretch(); ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok1,ok2,ok3,ok4,ok5;
        double sig=sigE->text().toDouble(&ok1); double smin=sigMinE->text().toDouble(&ok2);
        double smax=sigMaxE->text().toDouble(&ok3); double lrv=lrvE->text().toDouble(&ok4);
        double urv=urvE->text().toDouble(&ok5);
        if(!ok1||!ok2||!ok3||smax<=smin||!ok4||!ok5||urv<=lrv) return;
        try {
            auto r=Kipia::SignalScalingCalculator::signalToPV(sig,smin,smax,lrv,urv);
            resultL->setText(QString("%1 (%2 %)").arg(r.processValue,0,'f',2).arg(r.signalPercent,0,'f',1));
        } catch(...) {}
    });

    tabs->addTab(page, "Масштабирование");
}

void KipiaTab::setupRtd(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page); ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("RTD Pt100 / Pt500 / Pt1000", ic));

    auto* modeCombo = new QComboBox(ic);
    modeCombo->addItem("Температура → Сопротивление");
    modeCombo->addItem("Сопротивление → Температура");
    il->addWidget(mkF(ic, "Режим", modeCombo));

    auto* valE = new QLineEdit("100", ic); il->addWidget(mkF(ic, "Значение", valE));
    auto* r0Combo = new QComboBox(ic);
    r0Combo->addItem("Pt100 (R0=100 Ом)");
    r0Combo->addItem("Pt500 (R0=500 Ом)");
    r0Combo->addItem("Pt1000 (R0=1000 Ом)");
    il->addWidget(mkF(ic, "Тип датчика", r0Combo));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    bl->addWidget(cb); bl->addStretch();
    il->addSpacing(8); il->addWidget(br); ml->addWidget(ic);

    auto* rc = new QFrame(page); rc->setObjectName("Card");
    auto* rl = new QVBoxLayout(rc); rl->setContentsMargins(20,20,20,20); rl->setSpacing(12);
    rl->addWidget(new QLabel("Результат", rc));
    rl->addWidget(resultL);
    rl->addStretch(); ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok; double val=valE->text().toDouble(&ok);
        if(!ok) return;
        double r0 = (r0Combo->currentIndex() == 0) ? 100.0 : (r0Combo->currentIndex() == 1 ? 500.0 : 1000.0);
        try {
            Kipia::RtdResult r;
            if (modeCombo->currentIndex() == 0)
                r = Kipia::RtdCalculator::tempToResistance(val, r0);
            else
                r = Kipia::RtdCalculator::resistanceToTemp(val, r0);
            resultL->setText(QString("%1 °C → %2 Ом").arg(r.temperature,0,'f',2).arg(r.resistance,0,'f',3));
        } catch(...) {}
    });

    tabs->addTab(page, "RTD");
}

void KipiaTab::setupPid(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page); ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("Настройка ПИД", ic));

    auto* kuE = new QLineEdit("2.0", ic); il->addWidget(mkF(ic, "Критическое усиление Ku", kuE));
    auto* tuE = new QLineEdit("10", ic); il->addWidget(mkF(ic, "Критический период Tu (с)", tuE));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    bl->addWidget(cb); bl->addStretch();
    il->addSpacing(8); il->addWidget(br); ml->addWidget(ic);

    auto* rc = new QFrame(page); rc->setObjectName("Card");
    auto* rl = new QVBoxLayout(rc); rl->setContentsMargins(20,20,20,20); rl->setSpacing(12);
    rl->addWidget(new QLabel("Результат", rc));
    rl->addWidget(resultL);
    auto* grid = new QGridLayout(); grid->setSpacing(8);
    auto mkD=[&](const QString& lb,int r,int col)->QLabel*{
        auto* it=new QFrame(rc); it->setStyleSheet("background:#1A1D23;border-radius:8px;");
        auto* il2=new QVBoxLayout(it); il2->setContentsMargins(12,8,12,8); il2->setSpacing(4);
        auto* la=new QLabel(lb,it); la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;"); il2->addWidget(la);
        auto* va=new QLabel("—",it); va->setStyleSheet("font-family:'Consolas',monospace;font-size:16px;font-weight:600;color:#E6EAF0;"); il2->addWidget(va);
        grid->addWidget(it,r,col); return va;
    };
    auto* dTi = mkD("Ti (с)",0,0);
    auto* dTd = mkD("Td (с)",0,1);
    auto* dKi = mkD("Ki",1,0);
    auto* dKd = mkD("Kd",1,1);
    rl->addLayout(grid); rl->addStretch(); ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok1,ok2; double ku=kuE->text().toDouble(&ok1); double tu=tuE->text().toDouble(&ok2);
        if(!ok1||ku<=0||!ok2||tu<=0) return;
        try {
            auto r=Kipia::PidTuningCalculator::zieglerNichols(ku,tu);
            resultL->setText(QString("Kp = %1").arg(r.kp,0,'f',3));
            dTi->setText(QString("%1 с").arg(r.ti,0,'f',2));
            dTd->setText(QString("%1 с").arg(r.td,0,'f',2));
            dKi->setText(QString("%1").arg(r.ki,0,'f',4));
            dKd->setText(QString("%1").arg(r.kd,0,'f',4));
        } catch(...) {}
    });

    tabs->addTab(page, "ПИД");
}

void KipiaTab::setupAccuracy(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page); ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("Погрешности и разрядность", ic));

    auto* classE = new QLineEdit("0.5", ic); il->addWidget(mkF(ic, "Класс точности (%)", classE));
    auto* rangeE = new QLineEdit("100", ic); il->addWidget(mkF(ic, "Диапазон", rangeE));
    auto* bitsE = new QLineEdit("12", ic); il->addWidget(mkF(ic, "Разрядность АЦП", bitsE));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    bl->addWidget(cb); bl->addStretch();
    il->addSpacing(8); il->addWidget(br); ml->addWidget(ic);

    auto* rc = new QFrame(page); rc->setObjectName("Card");
    auto* rl = new QVBoxLayout(rc); rl->setContentsMargins(20,20,20,20); rl->setSpacing(12);
    rl->addWidget(new QLabel("Результат", rc));
    rl->addWidget(resultL);
    auto* grid = new QGridLayout(); grid->setSpacing(8);
    auto mkD=[&](const QString& lb,int r,int col)->QLabel*{
        auto* it=new QFrame(rc); it->setStyleSheet("background:#1A1D23;border-radius:8px;");
        auto* il2=new QVBoxLayout(it); il2->setContentsMargins(12,8,12,8); il2->setSpacing(4);
        auto* la=new QLabel(lb,it); la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;"); il2->addWidget(la);
        auto* va=new QLabel("—",it); va->setStyleSheet("font-family:'Consolas',monospace;font-size:16px;font-weight:600;color:#E6EAF0;"); il2->addWidget(va);
        grid->addWidget(it,r,col); return va;
    };
    auto* dAbs = mkD("АБС. ПОГРЕШНОСТЬ",0,0);
    auto* dLsb = mkD("LSB АЦП",0,1);
    rl->addLayout(grid); rl->addStretch(); ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok1,ok2,ok3;
        double cls=classE->text().toDouble(&ok1); double range=rangeE->text().toDouble(&ok2);
        int bits=bitsE->text().toInt(&ok3);
        if(!ok1||cls<=0||!ok2||range<=0||!ok3||bits<=0) return;
        try {
            auto r=Kipia::AccuracyCalculator::fromClass(cls,range);
            double lsb=Kipia::AccuracyCalculator::adcResolution(range,bits);
            resultL->setText(QString("±%1").arg(r.absoluteError,0,'f',3));
            dAbs->setText(QString("%1").arg(r.absoluteError,0,'f',3));
            dLsb->setText(QString("%1").arg(lsb,0,'f',4));
        } catch(...) {}
    });

    tabs->addTab(page, "Погрешности");
}

} // namespace Ui
