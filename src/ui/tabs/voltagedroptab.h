// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef UI_TABS_VOLDROPTAB_H
#define UI_TABS_VOLDROPTAB_H
#include <QWidget>
class QLineEdit; class QComboBox; class QLabel; class QVBoxLayout;
namespace Ui {
class VoltageDropTab : public QWidget {
    Q_OBJECT
public:
    explicit VoltageDropTab(QWidget *parent = nullptr);
private slots:
    void onCalculate(); void onReset();
private:
    void setupInput(QWidget* c, QVBoxLayout* l);
    void setupResult(QWidget* c, QVBoxLayout* l);
    QLineEdit* m_currentEdit; QLineEdit* m_lengthEdit;
    QLineEdit* m_resistanceEdit; QLineEdit* m_reactanceEdit;
    QLineEdit* m_voltageEdit; QLineEdit* m_cosPhiEdit;
    QLabel* m_resultVolts; QLabel* m_resultPercent;
    QLabel* m_detailDropVolts;
    QLabel* m_formulaText; QLabel* m_normativeText;
    QWidget* m_formulaPanel;
};
}
#endif
