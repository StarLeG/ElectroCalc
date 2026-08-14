// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef UI_TABS_EXTENSIONSTAB_H
#define UI_TABS_EXTENSIONSTAB_H
#include <QWidget>
class QTabWidget;
namespace Ui {
class ExtensionsTab : public QWidget {
    Q_OBJECT
public:
    explicit ExtensionsTab(QWidget *parent = nullptr);
private:
    void setupCompensation(QWidget* parent, QTabWidget* tabs);
    void setupMotor(QWidget* parent, QTabWidget* tabs);
    void setupTransformer(QWidget* parent, QTabWidget* tabs);
    void setupLighting(QWidget* parent, QTabWidget* tabs);
    void setupUps(QWidget* parent, QTabWidget* tabs);
};
}
#endif
