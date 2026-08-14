// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "extensionstab.h"
#include "core/compensation.h"
#include "core/motor.h"
#include "core/transformer.h"
#include "core/lighting.h"
#include "core/ups.h"

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

static QFrame* mkResult(QWidget* parent) {
    auto* f = new QFrame(parent);
    f->setStyleSheet("background:#2E343F;border:1px solid #3A414D;border-radius:8px;padding:14px;");
    return f;
}

ExtensionsTab::ExtensionsTab(QWidget* p) : QWidget(p) {
    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(24,24,24,24);

    auto* tabs = new QTabWidget(this);
    setupCompensation(this, tabs);
    setupMotor(this, tabs);
    setupTransformer(this, tabs);
    setupLighting(this, tabs);
    setupUps(this, tabs);
    layout->addWidget(tabs);
}

void ExtensionsTab::setupCompensation(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page);
    ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("Компенсация реактивной мощности", ic));

    auto* powerE = new QLineEdit("100", ic); il->addWidget(mkF(ic, "Активная мощность (кВт)", powerE));
    auto* cosBefE = new QLineEdit("0.6", ic); il->addWidget(mkF(ic, "cos φ до компенсации", cosBefE));
    auto* cosAftE = new QLineEdit("0.95", ic); il->addWidget(mkF(ic, "cos φ после компенсации", cosAftE));
    auto* stepE = new QLineEdit("10", ic); il->addWidget(mkF(ic, "Размер ступени (квар)", stepE));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);
    resultL->setWordWrap(true);
    il->addSpacing(8);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    auto* rb = new QPushButton("Сбросить", br); rb->setObjectName("Ghost");
    bl->addWidget(cb); bl->addWidget(rb); bl->addStretch();
    il->addWidget(br);
    ml->addWidget(ic);

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
    auto* dSteps = mkD("СТУПЕНЕЙ",0,0);
    auto* dBefore = mkD("ДО (квар)",0,1);
    auto* dAfter = mkD("ПОСЛЕ (квар)",1,0);
    auto* dSave = mkD("ЭКОНОМИЯ (%)",1,1);
    rl->addLayout(grid);

    auto* fp = mkResult(rc);
    auto* fpl = new QVBoxLayout(fp); fpl->setSpacing(4);
    auto* ft = new QLabel("ФОРМУЛА", fp); ft->setStyleSheet("font-size:11px;font-weight:600;color:#9AA4B2;"); fpl->addWidget(ft);
    auto* fm = new QLabel("", fp); fm->setStyleSheet("font-family:'Consolas',monospace;font-size:14px;color:#38BDF8;"); fpl->addWidget(fm);
    fp->setVisible(false);
    rl->addWidget(fp); rl->addStretch();
    ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok1,ok2,ok3,ok4;
        double P=powerE->text().toDouble(&ok1); double cb2=cosBefE->text().toDouble(&ok2);
        double ca=cosAftE->text().toDouble(&ok3); double step=stepE->text().toDouble(&ok4);
        if(!ok1||P<=0||!ok2||cb2<0.1||cb2>1||!ok3||ca<cb2||ca>1||!ok4||step<=0) return;
        try {
            auto r=Core::CompensationCalculator::compensate(P,cb2,ca,step);
            resultL->setText(QString("%1 квар").arg(r.reactivePower,0,'f',1));
            dSteps->setText(QString::number(r.steps));
            dBefore->setText(QString("%1 квар").arg(r.reactiveBefore,0,'f',1));
            dAfter->setText(QString("%1 квар").arg(r.reactiveAfter,0,'f',1));
            dSave->setText(QString("%1 %").arg(r.savingsPercent,0,'f',1));
            fm->setText("Qc = P·(tgφ1 − tgφ2)");
            fp->setVisible(true);
        } catch(...) {}
    });

    connect(rb, &QPushButton::clicked, this, [=]() {
        powerE->setText("100"); cosBefE->setText("0.6"); cosAftE->setText("0.95"); stepE->setText("10");
        resultL->setText("—"); dSteps->setText("—"); dBefore->setText("—"); dAfter->setText("—"); dSave->setText("—"); fp->setVisible(false);
    });

    tabs->addTab(page, "Компенсация");
}

void ExtensionsTab::setupMotor(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page);
    ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("Электродвигатель", ic));

    auto* powE = new QLineEdit("7.5", ic); il->addWidget(mkF(ic, "Мощность (кВт)", powE));
    auto* voltE = new QLineEdit("380", ic); il->addWidget(mkF(ic, "Напряжение (В)", voltE));
    auto* cosE = new QLineEdit("0.85", ic); il->addWidget(mkF(ic, "cos φ", cosE));
    auto* effE = new QLineEdit("0.9", ic); il->addWidget(mkF(ic, "КПД", effE));
    auto* multE = new QLineEdit("7", ic); il->addWidget(mkF(ic, "Кратность пускового тока", multE));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    auto* rb = new QPushButton("Сбросить", br); rb->setObjectName("Ghost");
    bl->addWidget(cb); bl->addWidget(rb); bl->addStretch();
    il->addSpacing(8); il->addWidget(br);
    ml->addWidget(ic);

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
    auto* dIst = mkD("ПУСКОВОЙ ТОК",0,0);
    auto* dBrk = mkD("АВТОМАТ (А)",0,1);
    auto* dSec = mkD("СЕЧЕНИЕ (мм²)",1,0);
    rl->addLayout(grid); rl->addStretch();
    ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok1,ok2,ok3,ok4,ok5;
        double P=powE->text().toDouble(&ok1); double U=voltE->text().toDouble(&ok2);
        double cos=cosE->text().toDouble(&ok3); double eff=effE->text().toDouble(&ok4);
        double mult=multE->text().toDouble(&ok5);
        if(!ok1||P<=0||!ok2||U<=0||!ok3||cos<0.1||cos>1||!ok4||eff<=0||eff>1||!ok5||mult<=0) return;
        try {
            auto r=Core::MotorCalculator::calculate(P,U,cos,eff,mult);
            resultL->setText(QString("%1 А").arg(r.nominalCurrent,0,'f',1));
            dIst->setText(QString("%1 А").arg(r.startingCurrent,0,'f',0));
            dBrk->setText(QString("%1 А").arg(r.breakerRating,0,'f',0));
            dSec->setText(QString("%1 мм²").arg(r.cableSection,0,'f',1));
        } catch(...) {}
    });

    connect(rb, &QPushButton::clicked, this, [=]() {
        powE->setText("7.5"); voltE->setText("380"); cosE->setText("0.85"); effE->setText("0.9"); multE->setText("7");
        resultL->setText("—"); dIst->setText("—"); dBrk->setText("—"); dSec->setText("—");
    });

    tabs->addTab(page, "Двигатели");
}

void ExtensionsTab::setupTransformer(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page);
    ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("Трансформатор", ic));

    auto* powE = new QLineEdit("500", ic); il->addWidget(mkF(ic, "Нагрузка (кВт)", powE));
    auto* cosE = new QLineEdit("0.9", ic); il->addWidget(mkF(ic, "cos φ", cosE));
    auto* hnE = new QLineEdit("10", ic); il->addWidget(mkF(ic, "Напряжение ВН (кВ)", hnE));
    auto* lnE = new QLineEdit("0.4", ic); il->addWidget(mkF(ic, "Напряжение НН (кВ)", lnE));
    auto* ukE = new QLineEdit("5", ic); il->addWidget(mkF(ic, "uк (%)", ukE));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    auto* rb = new QPushButton("Сбросить", br); rb->setObjectName("Ghost");
    bl->addWidget(cb); bl->addWidget(rb); bl->addStretch();
    il->addSpacing(8); il->addWidget(br);
    ml->addWidget(ic);

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
    auto* dIHN = mkD("ТОК ВН (А)",0,0);
    auto* dILN = mkD("ТОК НН (А)",0,1);
    auto* dIkz = mkD("ТОК КЗ (А)",1,0);
    auto* dLoad = mkD("ЗАГРУЗКА",1,1);
    rl->addLayout(grid); rl->addStretch();
    ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok1,ok2,ok3,ok4,ok5;
        double P=powE->text().toDouble(&ok1); double cos=cosE->text().toDouble(&ok2);
        double hn=hnE->text().toDouble(&ok3); double ln=lnE->text().toDouble(&ok4);
        double uk=ukE->text().toDouble(&ok5);
        if(!ok1||P<=0||!ok2||cos<=0||cos>1||!ok3||hn<=0||!ok4||ln<=0||!ok5||uk<=0) return;
        try {
            auto r=Core::TransformerCalculator::calculate(P,cos,hn,ln,uk);
            resultL->setText(QString("%1 кВА").arg(r.power,0,'f',0));
            dIHN->setText(QString("%1 А").arg(r.currentHN,0,'f',1));
            dILN->setText(QString("%1 А").arg(r.currentLN,0,'f',1));
            dIkz->setText(QString("%1 А").arg(r.shortCircuitCurrent,0,'f',0));
            dLoad->setText(QString("%1").arg(r.loadFactor,0,'f',2));
        } catch(...) {}
    });

    connect(rb, &QPushButton::clicked, this, [=]() {
        powE->setText("500"); cosE->setText("0.9"); hnE->setText("10"); lnE->setText("0.4"); ukE->setText("5");
        resultL->setText("—"); dIHN->setText("—"); dILN->setText("—"); dIkz->setText("—"); dLoad->setText("—");
    });

    tabs->addTab(page, "Трансформатор");
}

void ExtensionsTab::setupLighting(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page);
    ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("Освещение", ic));

    auto* areaE = new QLineEdit("50", ic); il->addWidget(mkF(ic, "Площадь помещения (м²)", areaE));
    auto* luxE = new QLineEdit("300", ic); il->addWidget(mkF(ic, "Требуемая освещённость (лк)", luxE));
    auto* fluxE = new QLineEdit("3000", ic); il->addWidget(mkF(ic, "Световой поток светильника (лм)", fluxE));
    auto* utilE = new QLineEdit("0.6", ic); il->addWidget(mkF(ic, "КИП (утилизация)", utilE));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    auto* rb = new QPushButton("Сбросить", br); rb->setObjectName("Ghost");
    bl->addWidget(cb); bl->addWidget(rb); bl->addStretch();
    il->addSpacing(8); il->addWidget(br);
    ml->addWidget(ic);

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
    auto* dPower = mkD("МОЩНОСТЬ (Вт)",0,0);
    auto* dSpec = mkD("УДЕЛЬНАЯ (Вт/м²)",0,1);
    rl->addLayout(grid); rl->addStretch();
    ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok1,ok2,ok3,ok4;
        double area=areaE->text().toDouble(&ok1); double lux=luxE->text().toDouble(&ok2);
        double flux=fluxE->text().toDouble(&ok3); double util=utilE->text().toDouble(&ok4);
        if(!ok1||area<=0||!ok2||lux<=0||!ok3||flux<=0||!ok4||util<=0||util>1) return;
        try {
            auto r=Core::LightingCalculator::calculate(area,lux,flux,util);
            resultL->setText(QString("%1 светильников").arg(r.luminaireCount));
            dPower->setText(QString("%1 Вт").arg(r.installedPower,0,'f',0));
            dSpec->setText(QString("%1 Вт/м²").arg(r.specificPower,0,'f',1));
        } catch(...) {}
    });

    connect(rb, &QPushButton::clicked, this, [=]() {
        areaE->setText("50"); luxE->setText("300"); fluxE->setText("3000"); utilE->setText("0.6");
        resultL->setText("—"); dPower->setText("—"); dSpec->setText("—");
    });

    tabs->addTab(page, "Освещение");
}

void ExtensionsTab::setupUps(QWidget*, QTabWidget* tabs) {
    auto* page = new QWidget();
    auto* ml = new QHBoxLayout(page);
    ml->setContentsMargins(16,16,16,16); ml->setSpacing(16);

    auto* ic = new QFrame(page); ic->setObjectName("Card"); ic->setMinimumWidth(320); ic->setMaximumWidth(400);
    auto* il = new QVBoxLayout(ic); il->setContentsMargins(20,20,20,20); il->setSpacing(12);
    il->addWidget(new QLabel("ИБП / АКБ / Генератор", ic));

    auto* powE = new QLineEdit("5", ic); il->addWidget(mkF(ic, "Нагрузка (кВт)", powE));
    auto* timeE = new QLineEdit("30", ic); il->addWidget(mkF(ic, "Время резерва (мин)", timeE));
    auto* voltE = new QLineEdit("12", ic); il->addWidget(mkF(ic, "Напряжение АКБ (В)", voltE));
    auto* effE = new QLineEdit("0.9", ic); il->addWidget(mkF(ic, "КПД ИБП", effE));

    auto* resultL = new QLabel("—", ic);
    resultL->setObjectName("ResultValue");
    resultL->setAlignment(Qt::AlignCenter);

    auto* br = new QWidget(ic); auto* bl = new QHBoxLayout(br); bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br); cb->setObjectName("Primary");
    auto* rb = new QPushButton("Сбросить", br); rb->setObjectName("Ghost");
    bl->addWidget(cb); bl->addWidget(rb); bl->addStretch();
    il->addSpacing(8); il->addWidget(br);
    ml->addWidget(ic);

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
    auto* dAh = mkD("ЁМКОСТЬ (А·ч)",0,0);
    auto* dGen = mkD("ГЕНЕРАТОР (кВА)",0,1);
    rl->addLayout(grid); rl->addStretch();
    ml->addWidget(rc);

    connect(cb, &QPushButton::clicked, this, [=]() {
        bool ok1,ok2,ok3,ok4;
        double P=powE->text().toDouble(&ok1); double t=timeE->text().toDouble(&ok2);
        double U=voltE->text().toDouble(&ok3); double eff=effE->text().toDouble(&ok4);
        if(!ok1||P<=0||!ok2||t<=0||!ok3||U<=0||!ok4||eff<=0||eff>1) return;
        try {
            auto r=Core::UpsCalculator::calculate(P,t,U,eff);
            resultL->setText(QString("%1 А·ч").arg(r.capacity,0,'f',0));
            dAh->setText(QString("%1 А·ч").arg(r.capacity,0,'f',0));
            dGen->setText(QString("%1 кВА").arg(r.generatorPower,0,'f',1));
        } catch(...) {}
    });

    connect(rb, &QPushButton::clicked, this, [=]() {
        powE->setText("5"); timeE->setText("30"); voltE->setText("12"); effE->setText("0.9");
        resultL->setText("—"); dAh->setText("—"); dGen->setText("—");
    });

    tabs->addTab(page, "ИБП/АКБ");
}

} // namespace Ui
