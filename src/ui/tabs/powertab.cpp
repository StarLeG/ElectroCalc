// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "powertab.h"
#include "core/power.h"

#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QLabel>
#include <QLineEdit>
#include <QComboBox>
#include <QPushButton>
#include <QFrame>
#include <QStackedWidget>
#include <QDoubleValidator>
#include <QTabBar>
#include <QStatusBar>

namespace Ui {

PowerTab::PowerTab(QWidget *parent)
    : QWidget(parent)
{
    auto* mainLayout = new QHBoxLayout(this);
    mainLayout->setContentsMargins(24, 24, 24, 24);
    mainLayout->setSpacing(24);

    // === Левая карточка — Исходные данные ===
    auto* inputCard = new QFrame(this);
    inputCard->setObjectName("Card");
    inputCard->setMinimumWidth(360);
    inputCard->setMaximumWidth(420);
    auto* inputLayout = new QVBoxLayout(inputCard);
    inputLayout->setContentsMargins(24, 24, 24, 24);
    inputLayout->setSpacing(16);
    setupInputCard(inputCard, inputLayout);
    mainLayout->addWidget(inputCard);

    // === Правая карточка — Результат ===
    auto* resultCard = new QFrame(this);
    resultCard->setObjectName("Card");
    auto* resultLayout = new QVBoxLayout(resultCard);
    resultLayout->setContentsMargins(24, 24, 24, 24);
    resultLayout->setSpacing(16);
    setupResultCard(resultCard, resultLayout);
    mainLayout->addWidget(resultCard);

    // Авто-расчёт при запуске
    onCalculate();
}

static QWidget* makeField(QWidget* parent, const QString& label, QWidget* widget)
{
    auto* group = new QWidget(parent);
    auto* lay = new QVBoxLayout(group);
    lay->setContentsMargins(0, 0, 0, 0);
    lay->setSpacing(6);
    auto* lbl = new QLabel(label, group);
    lbl->setStyleSheet("font-size: 13px; font-weight: 600; color: #9AA4B2;");
    lay->addWidget(lbl);
    lay->addWidget(widget);
    return group;
}

void PowerTab::setupInputCard(QWidget* card, QVBoxLayout* layout)
{
    auto* title = new QLabel("Исходные данные", card);
    title->setStyleSheet("font-size: 16px; font-weight: 600;");
    layout->addWidget(title);

    // Мощность
    m_powerEdit = new QLineEdit("2.2", card);
    m_powerEdit->setPlaceholderText("Введите мощность");
    layout->addWidget(makeField(card, "Мощность (кВт)", m_powerEdit));

    // Напряжение + Фазность в один ряд
    auto* rowVF = new QWidget(card);
    auto* rowVFLayout = new QHBoxLayout(rowVF);
    rowVFLayout->setContentsMargins(0, 0, 0, 0);
    rowVFLayout->setSpacing(12);

    m_voltageEdit = new QLineEdit("380", rowVF);
    rowVFLayout->addWidget(makeField(rowVF, "Напряжение (В)", m_voltageEdit));

    m_phaseCombo = new QComboBox(rowVF);
    m_phaseCombo->addItem("1 фаза");
    m_phaseCombo->addItem("3 фазы");
    m_phaseCombo->setCurrentIndex(1);
    rowVFLayout->addWidget(makeField(rowVF, "Фазность", m_phaseCombo));

    layout->addWidget(rowVF);

    // cos φ + КПД в один ряд
    auto* rowCE = new QWidget(card);
    auto* rowCELayout = new QHBoxLayout(rowCE);
    rowCELayout->setContentsMargins(0, 0, 0, 0);
    rowCELayout->setSpacing(12);

    m_cosPhiEdit = new QLineEdit("0.85", rowCE);
    rowCELayout->addWidget(makeField(rowCE, "cos φ", m_cosPhiEdit));

    m_efficiencyEdit = new QLineEdit("0.92", rowCE);
    rowCELayout->addWidget(makeField(rowCE, "КПД", m_efficiencyEdit));

    layout->addWidget(rowCE);

    // Ток нагрузки (А) — опциональное поле
    m_currentEdit = new QLineEdit(card);
    m_currentEdit->setPlaceholderText("Рассчитывается автоматически");
    m_currentEdit->setReadOnly(true);
    m_currentEdit->setStyleSheet(
        "background: #252A33; border: 1px solid #3A414D; border-radius: 6px;"
        "padding: 8px 12px; color: #9AA4B2; font-size: 14px;");
    layout->addWidget(makeField(card, "Ток нагрузки (А)", m_currentEdit));

    // Кнопки
    layout->addSpacing(8);
    auto* btnRow = new QWidget(card);
    auto* btnLayout = new QHBoxLayout(btnRow);
    btnLayout->setContentsMargins(0, 0, 0, 0);

    auto* calcBtn = new QPushButton("Рассчитать", btnRow);
    calcBtn->setObjectName("Primary");
    connect(calcBtn, &QPushButton::clicked, this, &PowerTab::onCalculate);
    btnLayout->addWidget(calcBtn);

    auto* resetBtn = new QPushButton("Сбросить", btnRow);
    resetBtn->setObjectName("Ghost");
    connect(resetBtn, &QPushButton::clicked, this, &PowerTab::onReset);
    btnLayout->addWidget(resetBtn);

    btnLayout->addStretch();
    layout->addWidget(btnRow);
}

void PowerTab::setupResultCard(QWidget* card, QVBoxLayout* layout)
{
    auto* title = new QLabel("Результат", card);
    title->setStyleSheet("font-size: 16px; font-weight: 600;");
    layout->addWidget(title);

    // Табло результата
    auto* resultDisplay = new QWidget(card);
    auto* rdl = new QVBoxLayout(resultDisplay);
    rdl->setAlignment(Qt::AlignCenter);
    rdl->setSpacing(4);

    m_resultValue = new QLabel("—", resultDisplay);
    m_resultValue->setObjectName("ResultValue");
    m_resultValue->setAlignment(Qt::AlignCenter);
    rdl->addWidget(m_resultValue);

    m_resultUnit = new QLabel("Ампер", resultDisplay);
    m_resultUnit->setObjectName("ResultUnit");
    m_resultUnit->setAlignment(Qt::AlignCenter);
    rdl->addWidget(m_resultUnit);

    m_resultDesc = new QLabel("Расчётный ток нагрузки", resultDisplay);
    m_resultDesc->setObjectName("ResultLabel");
    m_resultDesc->setAlignment(Qt::AlignCenter);
    rdl->addWidget(m_resultDesc);

    layout->addWidget(resultDisplay);

    // Сетка деталей: Полная + Активная (по эталону)
    auto* grid = new QGridLayout();
    grid->setSpacing(12);

    auto makeDetail = [&](const QString& label, int row, int col) -> QLabel* {
        auto* item = new QFrame(card);
        item->setStyleSheet("background: #1A1D23; border-radius: 8px;");
        auto* il = new QVBoxLayout(item);
        il->setContentsMargins(14, 10, 14, 10);
        il->setSpacing(4);
        auto* lbl = new QLabel(label, item);
        lbl->setStyleSheet("font-size: 11px; color: #9AA4B2; text-transform: uppercase; letter-spacing: 0.5px;");
        il->addWidget(lbl);
        auto* val = new QLabel("—", item);
        val->setStyleSheet("font-family: 'Consolas', monospace; font-size: 18px; font-weight: 600; color: #E6EAF0;");
        il->addWidget(val);
        grid->addWidget(item, row, col);
        return val;
    };

    m_detailApparent = makeDetail("ПОЛНАЯ МОЩНОСТЬ", 0, 0);
    m_detailActive   = makeDetail("АКТИВНАЯ МОЩНОСТЬ", 0, 1);

    layout->addLayout(grid);

    // Формула и норматив
    m_formulaPanel = new QFrame(card);
    m_formulaPanel->setObjectName("NormativePanel");
    m_formulaPanel->setStyleSheet(
        "background: #2E343F; border: none; border-radius: 8px; padding: 14px;");
    m_formulaPanel->setVisible(false);

    auto* fpLayout = new QVBoxLayout(m_formulaPanel);
    fpLayout->setSpacing(6);

    auto* fpTitle = new QLabel("ФОРМУЛА И НОРМАТИВ", m_formulaPanel);
    fpTitle->setStyleSheet("font-size: 11px; font-weight: 600; color: #9AA4B2; letter-spacing: 0.5px;");
    fpLayout->addWidget(fpTitle);

    m_formulaText = new QLabel("", m_formulaPanel);
    m_formulaText->setStyleSheet("font-family: 'Consolas', monospace; font-size: 15px; color: #38BDF8;");
    fpLayout->addWidget(m_formulaText);

    m_normativeText = new QLabel("", m_formulaPanel);
    m_normativeText->setStyleSheet("font-size: 12px; color: #9AA4B2; font-style: italic;");
    fpLayout->addWidget(m_normativeText);

    layout->addWidget(m_formulaPanel);

    // Кнопки экспорта
    auto* exportRow = new QWidget(card);
    auto* exportLayout = new QHBoxLayout(exportRow);
    exportLayout->setContentsMargins(0, 0, 0, 0);

    auto* exportBtn = new QPushButton("Экспорт PDF", exportRow);
    exportBtn->setObjectName("Secondary");
    exportLayout->addWidget(exportBtn);

    auto* copyBtn = new QPushButton("Копировать", exportRow);
    copyBtn->setObjectName("Ghost");
    exportLayout->addWidget(copyBtn);

    exportLayout->addStretch();
    layout->addWidget(exportRow);
}

void PowerTab::onCalculate()
{
    clearErrors();

    bool ok1, ok2, ok3, ok4;
    double power = m_powerEdit->text().toDouble(&ok1);
    double voltage = m_voltageEdit->text().toDouble(&ok2);
    double cosPhi = m_cosPhiEdit->text().toDouble(&ok3);
    double efficiency = m_efficiencyEdit->text().toDouble(&ok4);

    if (!ok1 || power <= 0) { showError(m_powerEdit, "Введите положительное число"); return; }
    if (!ok2 || voltage <= 0) { showError(m_voltageEdit, "Введите положительное число"); return; }
    if (!ok3 || cosPhi < 0.1 || cosPhi > 1.0) { showError(m_cosPhiEdit, "от 0.1 до 1.0"); return; }
    if (!ok4 || efficiency <= 0 || efficiency > 1.0) { showError(m_efficiencyEdit, "от 0.01 до 1.0"); return; }

    double powerW = power * 1000.0;
    bool isThreePhase = (m_phaseCombo->currentIndex() == 1);

    Core::PowerResult result;
    try {
        // Расчёт тока: I = P / (U × cos φ × η) для 1-ф, I = P / (√3 × U × cos φ × η) для 3-ф
        // Примечание: эталонный макет может использовать slightly different rounding
        if (isThreePhase)
            result = Core::PowerCalculator::threePhaseCurrent(powerW, voltage, cosPhi, efficiency);
        else
            result = Core::PowerCalculator::singlePhaseCurrent(powerW, voltage, cosPhi, efficiency);
    } catch (const std::exception& e) {
        m_resultValue->setText("Ошибка");
        m_resultUnit->setText(e.what());
        return;
    }

    m_resultValue->setText(QString::number(result.current, 'f', 2));
    m_resultUnit->setText("Ампер");
    m_resultDesc->setText("Расчётный ток нагрузки");

    // Обновить поле «Ток нагрузки»
    m_currentEdit->setText(QString::number(result.current, 'f', 2));
    m_currentEdit->setStyleSheet(
        "background: #252A33; border: 1px solid #3A414D; border-radius: 6px;"
        "padding: 8px 12px; color: #E6EAF0; font-size: 14px;");

    m_detailApparent->setText(QString("%1 кВА").arg(result.apparentPower / 1000.0, 0, 'f', 2));
    m_detailActive->setText(QString("%1 кВт").arg(power, 0, 'f', 2));

    QString formula = isThreePhase
        ? "I = P / (√3 × U × cos φ × η)"
        : "I = P / (U × cos φ × η)";
    m_formulaText->setText(formula);
    m_normativeText->setText(result.normativeRef);
    m_formulaPanel->setVisible(true);

    updateStatusBarCosPhi(cosPhi);
}

void PowerTab::onReset()
{
    m_powerEdit->setText("2.2");
    m_voltageEdit->setText("380");
    m_phaseCombo->setCurrentIndex(1);
    m_cosPhiEdit->setText("0.85");
    m_efficiencyEdit->setText("0.92");
    m_currentEdit->setText("");
    clearErrors();

    m_resultValue->setText("—");
    m_resultUnit->setText("Ампер");
    m_resultDesc->setText("Расчётный ток нагрузки");
    m_detailActive->setText("—");
    m_detailApparent->setText("—");
    m_formulaPanel->setVisible(false);
}

void PowerTab::showError(QLineEdit* field, const QString& msg)
{
    field->setStyleSheet(
        "background: #1A1D23; border: 1px solid #FF5D5D; border-radius: 6px;"
        "padding: 8px 12px; color: #E6EAF0; font-size: 14px;");
    field->setToolTip(msg);
}

void PowerTab::clearErrors()
{
    QString normalStyle =
        "background: #1A1D23; border: 1px solid #3A414D; border-radius: 6px;"
        "padding: 8px 12px; color: #E6EAF0; font-size: 14px;";
    m_powerEdit->setStyleSheet(normalStyle);
    m_voltageEdit->setStyleSheet(normalStyle);
    m_cosPhiEdit->setStyleSheet(normalStyle);
    m_efficiencyEdit->setStyleSheet(normalStyle);
}

void PowerTab::updateStatusBarCosPhi(double cosPhi)
{
    auto* sb = window()->findChild<QStatusBar *>(QString(), Qt::FindDirectChildrenOnly);
    if (!sb) return;
    const auto labels = sb->findChildren<QLabel *>();
    for (auto* lbl : labels) {
        if (lbl->text().startsWith("cos")) {
            lbl->setText(QString("cos φ: %1").arg(cosPhi, 0, 'f', 2));
            break;
        }
    }
}

} // namespace Ui
