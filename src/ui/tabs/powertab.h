// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UI_TABS_POWERTAB_H
#define UI_TABS_POWERTAB_H

#include <QWidget>

class QLineEdit;
class QComboBox;
class QLabel;
class QPushButton;
class QStackedWidget;
class QVBoxLayout;

namespace Ui {

class PowerTab : public QWidget
{
    Q_OBJECT

public:
    explicit PowerTab(QWidget *parent = nullptr);

private slots:
    void onCalculate();
    void onReset();

private:
    void setupInputCard(QWidget* parent, QVBoxLayout* parentLayout);
    void setupResultCard(QWidget* parent, QVBoxLayout* parentLayout);
    void showError(QLineEdit* field, const QString& msg);
    void clearErrors();
    void updateStatusBarCosPhi(double cosPhi);

    QLineEdit* m_powerEdit;
    QLineEdit* m_voltageEdit;
    QComboBox* m_phaseCombo;
    QLineEdit* m_cosPhiEdit;
    QLineEdit* m_efficiencyEdit;

    QLabel* m_resultValue;
    QLabel* m_resultUnit;
    QLabel* m_resultDesc;
    QLabel* m_detailApparent;
    QLabel* m_detailActive;
    QLabel* m_formulaText;
    QLabel* m_normativeText;
    QWidget* m_formulaPanel;
};

} // namespace Ui

#endif // UI_TABS_POWERTAB_H
