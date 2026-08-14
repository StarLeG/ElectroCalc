// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef UI_TABS_PROTECTIONTAB_H
#define UI_TABS_PROTECTIONTAB_H
#include <QWidget>
class QLineEdit; class QComboBox; class QLabel; class QVBoxLayout;
namespace Ui {
class ProtectionTab : public QWidget {
    Q_OBJECT
public:
    explicit ProtectionTab(QWidget *parent = nullptr);
private slots:
    void onCalculate(); void onReset();
private:
    QLineEdit* m_loadCurrentEdit; QComboBox* m_characteristicCombo;
    QLineEdit* m_leakageEdit;
    QLabel* m_resultBreaker; QLabel* m_detailRCD;
    QLabel* m_formulaText; QLabel* m_normativeText; QWidget* m_formulaPanel;
};
}
#endif
