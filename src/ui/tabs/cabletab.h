// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UI_TABS_CABLETAB_H
#define UI_TABS_CABLETAB_H

#include <QWidget>
class QLineEdit;
class QComboBox;
class QLabel;
class QVBoxLayout;

namespace Ui {
class CableTab : public QWidget {
    Q_OBJECT
public:
    explicit CableTab(QWidget *parent = nullptr);
private slots:
    void onCalculate();
    void onReset();
private:
    void setupInput(QWidget* card, QVBoxLayout* lay);
    void setupResult(QWidget* card, QVBoxLayout* lay);
    QLineEdit* m_currentEdit;
    QComboBox* m_materialCombo;
    QLineEdit* m_lengthEdit;
    QLineEdit* m_voltageEdit;
    QLabel* m_resultSection;
    QLabel* m_resultDiameter;
    QLabel* m_resultMaxCurrent;
    QLabel* m_detailHeating;
    QLabel* m_detailDensity;
    QLabel* m_detailDrop;
    QLabel* m_formulaText;
    QLabel* m_normativeText;
    QWidget* m_formulaPanel;
};
}
#endif
