// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef UI_TABS_GROUNDINGTAB_H
#define UI_TABS_GROUNDINGTAB_H
#include <QWidget>
class QLineEdit; class QComboBox; class QLabel; class QVBoxLayout;
namespace Ui {
class GroundingTab : public QWidget {
    Q_OBJECT
public:
    explicit GroundingTab(QWidget *parent = nullptr);
private slots:
    void onCalculate(); void onReset();
private:
    QLineEdit* m_resistivityEdit; QLineEdit* m_lengthEdit;
    QLineEdit* m_diameterEdit; QLineEdit* m_requiredEdit;
    QLabel* m_resultResistance; QLabel* m_detailElectrodes;
    QLabel* m_formulaText; QLabel* m_normativeText; QWidget* m_formulaPanel;
};
}
#endif
