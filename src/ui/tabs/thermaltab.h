// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef UI_TABS_THERMALTAB_H
#define UI_TABS_THERMALTAB_H
#include <QWidget>
class QLineEdit; class QComboBox; class QLabel; class QVBoxLayout;
namespace Ui {
class ThermalTab : public QWidget {
    Q_OBJECT
public:
    explicit ThermalTab(QWidget *parent = nullptr);
private slots:
    void onCalculate(); void onReset();
private:
    QLineEdit* m_currentEdit; QLineEdit* m_resistanceEdit;
    QLineEdit* m_timeEdit; QComboBox* m_materialCombo;
    QLineEdit* m_sectionEdit;
    QLabel* m_resultHeat; QLabel* m_detailMelting;
    QLabel* m_formulaText; QLabel* m_normativeText; QWidget* m_formulaPanel;
};
}
#endif
