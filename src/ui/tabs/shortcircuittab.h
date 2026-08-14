// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef UI_TABS_SCCALCTAB_H
#define UI_TABS_SCCALCTAB_H
#include <QWidget>
class QLineEdit; class QLabel; class QVBoxLayout;
namespace Ui {
class ShortCircuitTab : public QWidget {
    Q_OBJECT
public:
    explicit ShortCircuitTab(QWidget *parent = nullptr);
private slots:
    void onCalculate(); void onReset();
private:
    QLineEdit* m_voltageEdit; QLineEdit* m_impedanceEdit;
    QLabel* m_resultCurrent; QLabel* m_detailImpedance;
    QLabel* m_formulaText; QLabel* m_normativeText; QWidget* m_formulaPanel;
};
}
#endif
