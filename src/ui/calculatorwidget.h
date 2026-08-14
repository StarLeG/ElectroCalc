// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UI_CALCULATORWIDGET_H
#define UI_CALCULATORWIDGET_H

#include <QWidget>

class QLabel;
class QLineEdit;
class QComboBox;
class QPushButton;

namespace Ui {

/// Базовый виджет калькулятора с двумя карточками
class CalculatorWidget : public QWidget
{
    Q_OBJECT

public:
    explicit CalculatorWidget(QWidget *parent = nullptr);

protected:
    /// Создать поле ввода
    QLineEdit* addInputField(const QString& label, const QString& placeholder,
                             const QString& unit = "", double value = 0.0);

    /// Создать выпадающий список
    QComboBox* addComboBox(const QString& label, const QStringList& items,
                           int defaultIndex = 0);

    /// Показать результат
    void showResult(double value, const QString& unit, const QString& description);

    /// Показать дополнительные результаты
    void showDetails(const QVector<QPair<QString, QString>>& details);

    /// Показать формулу и норматив
    void showFormula(const QString& formula, const QString& normativeRef);

    /// Показать ошибку валидации
    void showError(QLineEdit* field, const QString& message);

    /// Очистить ошибку
    void clearError(QLineEdit* field);

    /// Очистить все результаты
    void clearResults();

    QWidget* m_inputCard;
    QWidget* m_resultCard;

private:
    void setupUI();

    QLabel* m_resultValue;
    QLabel* m_resultUnit;
    QLabel* m_resultLabel;
    QWidget* m_detailsGrid;
    QLabel* m_formulaText;
    QLabel* m_normativeText;
    QWidget* m_detailsWidget;
    QWidget* m_formulaWidget;
};

} // namespace Ui

#endif // UI_CALCULATORWIDGET_H
