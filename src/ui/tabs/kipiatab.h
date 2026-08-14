// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef UI_TABS_KIPIATAB_H
#define UI_TABS_KIPIATAB_H
#include <QWidget>
class QTabWidget;
namespace Ui {
class KipiaTab : public QWidget {
    Q_OBJECT
public:
    explicit KipiaTab(QWidget *parent = nullptr);
private:
    void setupCurrentLoop(QWidget* parent, QTabWidget* tabs);
    void setupScaling(QWidget* parent, QTabWidget* tabs);
    void setupRtd(QWidget* parent, QTabWidget* tabs);
    void setupPid(QWidget* parent, QTabWidget* tabs);
    void setupAccuracy(QWidget* parent, QTabWidget* tabs);
};
}
#endif
