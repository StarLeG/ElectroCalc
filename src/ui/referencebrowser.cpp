// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "referencebrowser.h"
#include "models/cabledatamodel.h"
#include "util/unitconverter.h"

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QTabWidget>
#include <QTableView>
#include <QComboBox>
#include <QLineEdit>
#include <QLabel>
#include <QFrame>
#include <QPushButton>
#include <QHeaderView>
#include <QGridLayout>

namespace Ui {

ReferenceBrowser::ReferenceBrowser(QWidget *parent)
    : QWidget(parent)
{
    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(24, 24, 24, 24);

    auto* tabs = new QTabWidget(this);
    setupCableTable(this, tabs);
    setupConverter(this, tabs);
    setupReference(this, tabs);
    layout->addWidget(tabs);
}

void ReferenceBrowser::setupCableTable(QWidget*, QTabWidget* tabs)
{
    auto* page = new QWidget();
    auto* layout = new QVBoxLayout(page);

    m_cableModel = new Models::CableDataModel(this);

    auto* table = new QTableView(page);
    table->setModel(m_cableModel);
    table->setAlternatingRowColors(true);
    table->horizontalHeader()->setStretchLastSection(true);
    table->horizontalHeader()->setSectionResizeMode(QHeaderView::ResizeToContents);
    table->verticalHeader()->setVisible(false);
    table->setSelectionBehavior(QAbstractItemView::SelectRows);
    layout->addWidget(table);

    tabs->addTab(page, "Таблица кабелей");
}

void ReferenceBrowser::setupConverter(QWidget*, QTabWidget* tabs)
{
    auto* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setSpacing(16);

    auto* desc = new QLabel("Конвертер единиц измерения", page);
    desc->setStyleSheet("font-size: 16px; font-weight: 600; margin-bottom: 8px;");
    layout->addWidget(desc);

    // Выбор типа конвертации
    auto* typeCombo = new QComboBox(page);
    typeCombo->addItem("Сечение: мм² ↔ AWG");
    typeCombo->addItem("Температура: °C ↔ °F");
    typeCombo->addItem("Мощность: кВт ↔ л.с.");
    typeCombo->addItem("Мощность: кВА ↔ кВт");
    typeCombo->addItem("Давление: МПа ↔ бар");
    typeCombo->addItem("Расход: м³/ч ↔ л/мин");
    layout->addWidget(typeCombo);

    // Поле ввода
    auto* inputRow = new QWidget(page);
    auto* inputLayout = new QHBoxLayout(inputRow);
    inputLayout->setContentsMargins(0, 0, 0, 0);
    inputLayout->setSpacing(12);

    m_converterInput = new QLineEdit("10", inputRow);
    m_converterInput->setPlaceholderText("Введите значение");
    inputLayout->addWidget(m_converterInput);

    auto* convertBtn = new QPushButton("Конвертировать", inputRow);
    convertBtn->setObjectName("Primary");
    inputLayout->addWidget(convertBtn);
    layout->addWidget(inputRow);

    // Результат
    m_converterResult = new QLabel("—", page);
    m_converterResult->setObjectName("ResultValue");
    m_converterResult->setAlignment(Qt::AlignCenter);
    m_converterResult->setStyleSheet("font-family: 'Consolas', monospace; font-size: 32px; font-weight: 700; color: #22E88A; padding: 24px;");
    layout->addWidget(m_converterResult);

    connect(convertBtn, &QPushButton::clicked, this, [this, typeCombo]() {
        bool ok;
        double val = m_converterInput->text().toDouble(&ok);
        if (!ok) { m_converterResult->setText("Ошибка"); return; }

        int type = typeCombo->currentIndex();
        QString result;
        switch (type) {
            case 0: // мм² → AWG
                result = QString("%1 мм² = %2").arg(val, 0, 'f', 2).arg(Util::UnitConverter::nearestAwg(val));
                break;
            case 1: // °C → °F
                result = QString("%1 °C = %2 °F").arg(val, 0, 'f', 1).arg(Util::UnitConverter::celsiusToFahrenheit(val), 0, 'f', 1);
                break;
            case 2: // кВт → л.с.
                result = QString("%1 кВт = %2 л.с.").arg(val, 0, 'f', 2).arg(Util::UnitConverter::kwToHP(val), 0, 'f', 2);
                break;
            case 3: // кВА → кВт (при cosφ=1)
                result = QString("%1 кВА = %2 кВт (при cosφ=1)").arg(val, 0, 'f', 2).arg(Util::UnitConverter::kvaToKw(val, 1.0), 0, 'f', 2);
                break;
            case 4: // МПа → бар
                result = QString("%1 МПа = %2 бар").arg(val, 0, 'f', 3).arg(Util::UnitConverter::mpaToBar(val), 0, 'f', 2);
                break;
            case 5: // м³/ч → л/мин
                result = QString("%1 м³/ч = %2 л/мин").arg(val, 0, 'f', 2).arg(Util::UnitConverter::m3hToLmin(val), 0, 'f', 2);
                break;
        }
        m_converterResult->setText(result);
    });

    layout->addStretch();
    tabs->addTab(page, "Конвертер единиц");
}

void ReferenceBrowser::setupReference(QWidget*, QTabWidget* tabs)
{
    auto* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setSpacing(16);

    auto* desc = new QLabel("Справочные данные", page);
    desc->setStyleSheet("font-size: 16px; font-weight: 600; margin-bottom: 8px;");
    layout->addWidget(desc);

    // Удельное сопротивление
    auto* resistivityLabel = new QLabel("Удельное сопротивление при 20°C:", page);
    resistivityLabel->setStyleSheet("font-size: 14px; font-weight: 600; color: #9AA4B2;");
    layout->addWidget(resistivityLabel);

    for (const auto& [name, value] : Util::UnitConverter::resistivityTable()) {
        auto* row = new QLabel(QString("  %1: %2 Ом·мм²/м").arg(name).arg(value, 0, 'f', 4), page);
        row->setStyleSheet("font-family: 'Consolas', monospace; font-size: 13px; color: #E6EAF0;");
        layout->addWidget(row);
    }

    // Степени защиты IP
    layout->addSpacing(16);
    auto* ipLabel = new QLabel("Степени защиты IP:", page);
    ipLabel->setStyleSheet("font-size: 14px; font-weight: 600; color: #9AA4B2;");
    layout->addWidget(ipLabel);

    for (const auto& [code, desc] : Util::UnitConverter::ipTable()) {
        auto* row = new QLabel(QString("  %1 — %2").arg(code, desc), page);
        row->setStyleSheet("font-size: 13px; color: #E6EAF0;");
        row->setWordWrap(true);
        layout->addWidget(row);
    }

    // Цветовая маркировка
    layout->addSpacing(16);
    auto* colorLabel = new QLabel("Цветовая маркировка проводов:", page);
    colorLabel->setStyleSheet("font-size: 14px; font-weight: 600; color: #9AA4B2;");
    layout->addWidget(colorLabel);

    for (const auto& [wire, color] : Util::UnitConverter::wireColorCodes()) {
        auto* row = new QLabel(QString("  %1: %2").arg(wire, color), page);
        row->setStyleSheet("font-size: 13px; color: #E6EAF0;");
        layout->addWidget(row);
    }

    layout->addStretch();
    tabs->addTab(page, "Справочник");
}

} // namespace Ui
