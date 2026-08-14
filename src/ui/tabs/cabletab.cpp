// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "cabletab.h"
#include "core/cable.h"

#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QLabel>
#include <QLineEdit>
#include <QComboBox>
#include <QPushButton>
#include <QFrame>

namespace Ui {

static QWidget* mkField(QWidget* p, const QString& lbl, QWidget* w) {
    auto* g = new QWidget(p);
    auto* l = new QVBoxLayout(g);
    l->setContentsMargins(0,0,0,0);
    l->setSpacing(6);
    auto* la = new QLabel(lbl, g);
    la->setStyleSheet("font-size:13px;font-weight:600;color:#9AA4B2;");
    l->addWidget(la);
    l->addWidget(w);
    return g;
}

CableTab::CableTab(QWidget *parent) : QWidget(parent) {
    auto* ml = new QHBoxLayout(this);
    ml->setContentsMargins(24,24,24,24);
    ml->setSpacing(24);

    auto* ic = new QFrame(this);
    ic->setObjectName("Card");
    ic->setMinimumWidth(360); ic->setMaximumWidth(420);
    auto* il = new QVBoxLayout(ic);
    il->setContentsMargins(24,24,24,24);
    il->setSpacing(16);
    setupInput(ic, il);
    ml->addWidget(ic);

    auto* rc = new QFrame(this);
    rc->setObjectName("Card");
    auto* rl = new QVBoxLayout(rc);
    rl->setContentsMargins(24,24,24,24);
    rl->setSpacing(16);
    setupResult(rc, rl);
    ml->addWidget(rc);
}

void CableTab::setupInput(QWidget* c, QVBoxLayout* l) {
    l->addWidget(new QLabel("Исходные данные", c));

    m_currentEdit = new QLineEdit("25", c);
    l->addWidget(mkField(c, "Расчётный ток (А)", m_currentEdit));

    m_materialCombo = new QComboBox(c);
    m_materialCombo->addItem("Медь (Cu)");
    m_materialCombo->addItem("Алюминий (Al)");
    l->addWidget(mkField(c, "Материал", m_materialCombo));

    auto* row = new QWidget(c);
    auto* rl = new QHBoxLayout(row);
    rl->setContentsMargins(0,0,0,0); rl->setSpacing(12);

    m_lengthEdit = new QLineEdit("50", row);
    rl->addWidget(mkField(row, "Длина линии (м)", m_lengthEdit));

    m_voltageEdit = new QLineEdit("380", row);
    rl->addWidget(mkField(row, "Напряжение (В)", m_voltageEdit));
    l->addWidget(row);

    m_maxDropEdit = new QLineEdit("5", c);
    l->addWidget(mkField(c, "Макс. потери (%)", m_maxDropEdit));

    l->addSpacing(8);
    auto* br = new QWidget(c);
    auto* bl = new QHBoxLayout(br);
    bl->setContentsMargins(0,0,0,0);
    auto* cb = new QPushButton("Рассчитать", br);
    cb->setObjectName("Primary");
    connect(cb, &QPushButton::clicked, this, &CableTab::onCalculate);
    bl->addWidget(cb);
    auto* rb = new QPushButton("Сбросить", br);
    rb->setObjectName("Ghost");
    connect(rb, &QPushButton::clicked, this, &CableTab::onReset);
    bl->addWidget(rb);
    bl->addStretch();
    l->addWidget(br);
}

void CableTab::setupResult(QWidget* c, QVBoxLayout* l) {
    l->addWidget(new QLabel("Результат", c));

    auto* rd = new QWidget(c);
    auto* rdl = new QVBoxLayout(rd);
    rdl->setAlignment(Qt::AlignCenter);
    rdl->setSpacing(4);

    m_resultSection = new QLabel("—", rd);
    m_resultSection->setObjectName("ResultValue");
    m_resultSection->setAlignment(Qt::AlignCenter);
    rdl->addWidget(m_resultSection);

    auto* unit = new QLabel("мм²", rd);
    unit->setObjectName("ResultUnit");
    unit->setAlignment(Qt::AlignCenter);
    rdl->addWidget(unit);

    auto* desc = new QLabel("Рекомендуемое сечение", rd);
    desc->setObjectName("ResultLabel");
    desc->setAlignment(Qt::AlignCenter);
    rdl->addWidget(desc);
    l->addWidget(rd);

    auto* grid = new QGridLayout();
    grid->setSpacing(12);
    auto mkDet = [&](const QString& lb, int r, int col) -> QLabel* {
        auto* it = new QFrame(c);
        it->setStyleSheet("background:#1A1D23;border-radius:8px;");
        auto* il2 = new QVBoxLayout(it);
        il2->setContentsMargins(14,10,14,10); il2->setSpacing(4);
        auto* la = new QLabel(lb, it);
        la->setStyleSheet("font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:0.5px;");
        il2->addWidget(la);
        auto* va = new QLabel("—", it);
        va->setStyleSheet("font-family:'Consolas',monospace;font-size:18px;font-weight:600;color:#E6EAF0;");
        il2->addWidget(va);
        grid->addWidget(it, r, col);
        return va;
    };
    m_resultDiameter = mkDet("ДИАМЕТР", 0, 0);
    m_resultMaxCurrent = mkDet("МАКС. ТОК", 0, 1);
    m_detailHeating = mkDet("ПО НАГРЕВУ", 1, 0);
    m_detailDensity = mkDet("ПО ПЛОТНОСТИ", 1, 1);
    m_detailDrop = mkDet("ПО ПОТЕРЯМ", 2, 0);
    l->addLayout(grid);

    m_formulaPanel = new QFrame(c);
    m_formulaPanel->setStyleSheet("background:#2E343F;border:1px solid #3A414D;border-radius:8px;padding:14px;");
    m_formulaPanel->setVisible(false);
    auto* fl = new QVBoxLayout(m_formulaPanel);
    fl->setSpacing(6);
    auto* ft = new QLabel("ФОРМУЛА И НОРМАТИВ", m_formulaPanel);
    ft->setStyleSheet("font-size:11px;font-weight:600;color:#9AA4B2;letter-spacing:0.5px;");
    fl->addWidget(ft);
    m_formulaText = new QLabel("", m_formulaPanel);
    m_formulaText->setStyleSheet("font-family:'Consolas',monospace;font-size:15px;color:#38BDF8;");
    fl->addWidget(m_formulaText);
    m_normativeText = new QLabel("", m_formulaPanel);
    m_normativeText->setStyleSheet("font-size:12px;color:#9AA4B2;font-style:italic;");
    fl->addWidget(m_normativeText);
    l->addWidget(m_formulaPanel);
    l->addStretch();
}

void CableTab::onCalculate() {
    bool ok1, ok2, ok3, ok4;
    double current = m_currentEdit->text().toDouble(&ok1);
    double length = m_lengthEdit->text().toDouble(&ok2);
    double voltage = m_voltageEdit->text().toDouble(&ok3);
    double maxDrop = m_maxDropEdit->text().toDouble(&ok4);
    if (!ok1 || current <= 0) return;
    if (!ok2 || length <= 0) return;
    if (!ok3 || voltage <= 0) return;
    if (!ok4 || maxDrop <= 0) return;

    QString mat = m_materialCombo->currentIndex() == 0 ? "Cu" : "Al";
    try {
        auto sel = Core::CableCalculator::selectByHeating(current, mat);
        auto chk = Core::CableCalculator::checkAllCriteria(current, sel.crossSection, length, voltage, maxDrop, mat);

        m_resultSection->setText(QString::number(sel.crossSection, 'f', 1));
        m_resultDiameter->setText(QString("%1 мм").arg(sel.diameter, 0, 'f', 2));
        m_resultMaxCurrent->setText(QString("%1 А").arg(sel.maxCurrent, 0, 'f', 0));
        m_detailHeating->setText(chk.meetsHeating ? "✓ Проходит" : "✗ Не проходит");
        m_detailDensity->setText(chk.meetsDensity ? "✓ Проходит" : "✗ Не проходит");
        m_detailDrop->setText(chk.meetsVoltageDrop ? "✓ Проходит" : "✗ Не проходит");

        m_formulaText->setText("S = I / j_эк");
        m_normativeText->setText(sel.normativeRef);
        m_formulaPanel->setVisible(true);
    } catch (...) {}
}

void CableTab::onReset() {
    m_currentEdit->setText("25");
    m_lengthEdit->setText("50");
    m_voltageEdit->setText("380");
    m_maxDropEdit->setText("5");
    m_resultSection->setText("—");
    m_resultDiameter->setText("—");
    m_resultMaxCurrent->setText("—");
    m_detailHeating->setText("—");
    m_detailDensity->setText("—");
    m_detailDrop->setText("—");
    m_formulaPanel->setVisible(false);
}

} // namespace Ui
