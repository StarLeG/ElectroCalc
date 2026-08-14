// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "calculatorwidget.h"
#include "util/constants.h"

#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QLabel>
#include <QLineEdit>
#include <QComboBox>
#include <QPushButton>
#include <QDoubleValidator>
#include <QGridLayout>
#include <QFrame>

namespace Ui {

CalculatorWidget::CalculatorWidget(QWidget *parent)
    : QWidget(parent)
{
    setupUI();
}

void CalculatorWidget::setupUI()
{
    auto* mainLayout = new QHBoxLayout(this);
    mainLayout->setContentsMargins(24, 24, 24, 24);
    mainLayout->setSpacing(24);

    // === Левая карточка (ввод) ===
    m_inputCard = new QFrame(this);
    m_inputCard->setObjectName("Card");
    m_inputCard->setMinimumWidth(360);
    m_inputCard->setMaximumWidth(420);

    auto* inputLayout = new QVBoxLayout(m_inputCard);
    inputLayout->setContentsMargins(24, 24, 24, 24);
    inputLayout->setSpacing(16);

    auto* inputTitle = new QLabel("Исходные данные", m_inputCard);
    inputTitle->setObjectName("CardTitle");
    inputTitle->setStyleSheet("font-size: 16px; font-weight: 600; margin-bottom: 8px;");
    inputLayout->addWidget(inputTitle);

    // Контейнер для полей ввода (заполняется подклассами)
    auto* fieldsWidget = new QWidget(m_inputCard);
    m_inputCard->setProperty("fieldsWidget", QVariant::fromValue(fieldsWidget));
    inputLayout->addWidget(fieldsWidget);

    inputLayout->addStretch();

    mainLayout->addWidget(m_inputCard);

    // === Правая карточка (результат) ===
    m_resultCard = new QFrame(this);
    m_resultCard->setObjectName("Card");

    auto* resultLayout = new QVBoxLayout(m_resultCard);
    resultLayout->setContentsMargins(24, 24, 24, 24);
    resultLayout->setSpacing(20);

    auto* resultTitle = new QLabel("Результат", m_resultCard);
    resultTitle->setObjectName("CardTitle");
    resultTitle->setStyleSheet("font-size: 16px; font-weight: 600; margin-bottom: 8px;");
    resultLayout->addWidget(resultTitle);

    // Табло результата
    auto* resultDisplay = new QWidget(m_resultCard);
    auto* resultDisplayLayout = new QVBoxLayout(resultDisplay);
    resultDisplayLayout->setAlignment(Qt::AlignCenter);

    m_resultValue = new QLabel("—", resultDisplay);
    m_resultValue->setObjectName("ResultValue");
    m_resultValue->setAlignment(Qt::AlignCenter);
    m_resultValue->setStyleSheet(
        "font-family: 'JetBrains Mono', 'Consolas', monospace;"
        "font-size: 48px; font-weight: 700; color: #22E88A;");
    resultDisplayLayout->addWidget(m_resultValue);

    m_resultUnit = new QLabel("", resultDisplay);
    m_resultUnit->setObjectName("ResultUnit");
    m_resultUnit->setAlignment(Qt::AlignCenter);
    m_resultUnit->setStyleSheet("font-size: 16px; color: #9AA4B2; margin-top: 4px;");
    resultDisplayLayout->addWidget(m_resultUnit);

    m_resultLabel = new QLabel("", resultDisplay);
    m_resultLabel->setObjectName("ResultLabel");
    m_resultLabel->setAlignment(Qt::AlignCenter);
    m_resultLabel->setStyleSheet("font-size: 13px; color: #64748B; margin-top: 2px;");
    resultDisplayLayout->addWidget(m_resultLabel);

    resultLayout->addWidget(resultDisplay);

    // Сетка дополнительных результатов
    m_detailsGrid = new QWidget(m_resultCard);
    m_detailsGrid->setStyleSheet("background: #1A1D23; border-radius: 8px; padding: 12px;");
    resultLayout->addWidget(m_detailsGrid);

    // Панель формулы
    m_formulaWidget = new QFrame(m_resultCard);
    m_formulaWidget->setObjectName("NormativePanel");
    m_formulaWidget->setStyleSheet(
        "background: #2E343F; border: 1px solid #3A414D; border-radius: 6px; padding: 12px;");
    m_formulaWidget->setVisible(false);

    auto* formulaLayout = new QVBoxLayout(m_formulaWidget);
    formulaLayout->setSpacing(6);

    auto* formulaTitle = new QLabel("Формула и норматив", m_formulaWidget);
    formulaTitle->setStyleSheet(
        "font-size: 11px; font-weight: 600; color: #9AA4B2; text-transform: uppercase;");
    formulaLayout->addWidget(formulaTitle);

    m_formulaText = new QLabel("", m_formulaWidget);
    m_formulaText->setStyleSheet(
        "font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #38BDF8;");
    formulaLayout->addWidget(m_formulaText);

    m_normativeText = new QLabel("", m_formulaWidget);
    m_normativeText->setStyleSheet("font-size: 12px; color: #9AA4B2; font-style: italic;");
    formulaLayout->addWidget(m_normativeText);

    resultLayout->addWidget(m_formulaWidget);

    // Кнопки экспорта
    auto* btnRow = new QWidget(m_resultCard);
    auto* btnLayout = new QHBoxLayout(btnRow);
    btnLayout->setContentsMargins(0, 8, 0, 0);

    auto* exportBtn = new QPushButton("Экспорт PDF", btnRow);
    exportBtn->setObjectName("Secondary");
    exportBtn->setStyleSheet(
        "background: transparent; color: #FFB300; border: 1px solid #FFB300;"
        "border-radius: 6px; padding: 10px 24px; font-size: 14px;");
    btnLayout->addWidget(exportBtn);

    auto* copyBtn = new QPushButton("Копировать", btnRow);
    copyBtn->setObjectName("Ghost");
    copyBtn->setStyleSheet(
        "background: transparent; color: #9AA4B2; border: none;"
        "border-radius: 6px; padding: 10px 16px; font-size: 14px;");
    btnLayout->addWidget(copyBtn);

    btnLayout->addStretch();
    resultLayout->addWidget(btnRow);

    mainLayout->addWidget(m_resultCard);
}

QLineEdit* CalculatorWidget::addInputField(const QString& label, const QString& placeholder,
                                           const QString& unit, double value)
{
    auto* fieldsWidget = m_inputCard->findChild<QWidget*>("fieldsWidget");
    if (!fieldsWidget) {
        // Создаём контейнер если его нет
        fieldsWidget = new QWidget(m_inputCard);
        fieldsWidget->setObjectName("fieldsWidget");
        auto* layout = m_inputCard->layout();
        layout->addWidget(fieldsWidget);
    }

    auto* group = new QWidget(fieldsWidget);
    auto* groupLayout = new QVBoxLayout(group);
    groupLayout->setContentsMargins(0, 0, 0, 0);
    groupLayout->setSpacing(6);

    auto* lbl = new QLabel(label, group);
    lbl->setStyleSheet("font-size: 13px; font-weight: 600; color: #9AA4B2;");
    groupLayout->addWidget(lbl);

    auto* input = new QLineEdit(group);
    input->setPlaceholderText(placeholder);
    input->setStyleSheet(
        "background: #1A1D23; border: 1px solid #3A414D; border-radius: 6px;"
        "padding: 10px 12px; color: #E6EAF0; font-size: 14px;");

    if (value != 0.0) {
        input->setText(QString::number(value, 'g', 4));
    }

    auto* validator = new QDoubleValidator(0, 1e9, 4, input);
    validator->setNotation(QDoubleValidator::StandardNotation);
    input->setValidator(validator);

    groupLayout->addWidget(input);

    if (!unit.isEmpty()) {
        auto* unitLabel = new QLabel(unit, group);
        unitLabel->setStyleSheet("font-size: 11px; color: #64748B;");
        groupLayout->addWidget(unitLabel);
    }

    // Добавляем в layout fieldsWidget
    if (!fieldsWidget->layout()) {
        auto* fl = new QVBoxLayout(fieldsWidget);
        fl->setContentsMargins(0, 0, 0, 0);
        fl->setSpacing(12);
    }
    fieldsWidget->layout()->addWidget(group);

    return input;
}

QComboBox* CalculatorWidget::addComboBox(const QString& label, const QStringList& items,
                                         int defaultIndex)
{
    auto* fieldsWidget = m_inputCard->findChild<QWidget*>("fieldsWidget");
    if (!fieldsWidget) {
        fieldsWidget = new QWidget(m_inputCard);
        fieldsWidget->setObjectName("fieldsWidget");
        auto* layout = m_inputCard->layout();
        layout->addWidget(fieldsWidget);
    }

    auto* group = new QWidget(fieldsWidget);
    auto* groupLayout = new QVBoxLayout(group);
    groupLayout->setContentsMargins(0, 0, 0, 0);
    groupLayout->setSpacing(6);

    auto* lbl = new QLabel(label, group);
    lbl->setStyleSheet("font-size: 13px; font-weight: 600; color: #9AA4B2;");
    groupLayout->addWidget(lbl);

    auto* combo = new QComboBox(group);
    combo->addItems(items);
    combo->setCurrentIndex(defaultIndex);
    combo->setStyleSheet(
        "background: #1A1D23; border: 1px solid #3A414D; border-radius: 6px;"
        "padding: 10px 12px; color: #E6EAF0; font-size: 14px;");
    groupLayout->addWidget(combo);

    if (!fieldsWidget->layout()) {
        auto* fl = new QVBoxLayout(fieldsWidget);
        fl->setContentsMargins(0, 0, 0, 0);
        fl->setSpacing(12);
    }
    fieldsWidget->layout()->addWidget(group);

    return combo;
}

void CalculatorWidget::showResult(double value, const QString& unit, const QString& description)
{
    m_resultValue->setText(QString::number(value, 'f', 2));
    m_resultUnit->setText(unit);
    m_resultLabel->setText(description);
}

void CalculatorWidget::showDetails(const QVector<QPair<QString, QString>>& details)
{
    // Очистить старые элементы
    if (m_detailsGrid->layout()) {
        QLayoutItem* item;
        while ((item = m_detailsGrid->layout()->takeAt(0)) != nullptr) {
            if (item->widget()) delete item->widget();
            delete item;
        }
    } else {
        auto* grid = new QGridLayout(m_detailsGrid);
        grid->setSpacing(12);
        grid->setContentsMargins(12, 12, 12, 12);
    }

    auto* grid = qobject_cast<QGridLayout*>(m_detailsGrid->layout());
    if (!grid) return;

    int row = 0, col = 0;
    for (const auto& [label, val] : details) {
        auto* item = new QWidget(m_detailsGrid);
        auto* itemLayout = new QVBoxLayout(item);
        itemLayout->setContentsMargins(12, 10, 12, 10);
        itemLayout->setSpacing(4);
        item->setStyleSheet("background: #252A33; border-radius: 6px;");

        auto* lbl = new QLabel(label, item);
        lbl->setStyleSheet("font-size: 11px; color: #9AA4B2; text-transform: uppercase;");
        itemLayout->addWidget(lbl);

        auto* valLabel = new QLabel(val, item);
        valLabel->setStyleSheet(
            "font-family: 'JetBrains Mono', monospace; font-size: 18px;"
            "font-weight: 600; color: #E6EAF0;");
        itemLayout->addWidget(valLabel);

        grid->addWidget(item, row, col);
        col++;
        if (col >= 2) { col = 0; row++; }
    }
}

void CalculatorWidget::showFormula(const QString& formula, const QString& normativeRef)
{
    m_formulaText->setText(formula);
    m_normativeText->setText(normativeRef);
    m_formulaWidget->setVisible(true);
}

void CalculatorWidget::showError(QLineEdit* field, const QString& message)
{
    field->setStyleSheet(
        "background: #1A1D23; border: 1px solid #FF5D5D; border-radius: 6px;"
        "padding: 10px 12px; color: #E6EAF0; font-size: 14px;");

    // Найти или создать label ошибки
    auto* parent = qobject_cast<QWidget*>(field->parent());
    if (parent) {
        auto* errLabel = parent->findChild<QLabel*>("ErrorMsg");
        if (errLabel) {
            errLabel->setText(message);
            errLabel->setVisible(true);
        } else {
            auto* newErr = new QLabel(message, parent);
            newErr->setObjectName("ErrorMsg");
            newErr->setStyleSheet("font-size: 11px; color: #FF5D5D; margin-top: 2px;");
            parent->layout()->addWidget(newErr);
        }
    }
}

void CalculatorWidget::clearError(QLineEdit* field)
{
    field->setStyleSheet(
        "background: #1A1D23; border: 1px solid #3A414D; border-radius: 6px;"
        "padding: 10px 12px; color: #E6EAF0; font-size: 14px;");

    auto* parent = qobject_cast<QWidget*>(field->parent());
    if (parent) {
        auto* errLabel = parent->findChild<QLabel*>("ErrorMsg");
        if (errLabel) errLabel->setVisible(false);
    }
}

void CalculatorWidget::clearResults()
{
    m_resultValue->setText("—");
    m_resultUnit->setText("");
    m_resultLabel->setText("");
    m_formulaWidget->setVisible(false);
}

} // namespace Ui
