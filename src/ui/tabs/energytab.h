// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef UI_TABS_ENERGYTAB_H
#define UI_TABS_ENERGYTAB_H
#include <QWidget>
class QLineEdit; class QLabel; class QVBoxLayout;
namespace Ui {
class EnergyTab : public QWidget {
    Q_OBJECT
public:
    explicit EnergyTab(QWidget *parent = nullptr);
private slots:
    void onCalculate(); void onReset();
private:
    QLineEdit* m_powerEdit; QLineEdit* m_timeEdit;
    QLineEdit* m_tariffEdit; QLineEdit* m_daysEdit;
    QLabel* m_resultKWh; QLabel* m_detailJoules;
    QLabel* m_detailCost;
    QLabel* m_formulaText; QLabel* m_normativeText; QWidget* m_formulaPanel;
};
}
#endif
