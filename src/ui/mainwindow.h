// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UI_MAINWINDOW_H
#define UI_MAINWINDOW_H

#include <QMainWindow>

class QStackedWidget;
class QLabel;
class QPushButton;

namespace Ui {
class NavigationRail;
}

namespace Util {
class Theme;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow() override;

private slots:
    void onThemeToggle();
    void onTabRequested(int index);

private:
    void setupUI();
    void setupNavigation();
    void setupTopBar();
    void setupStatusBar();
    void applyTheme();

    Util::Theme* m_theme;
    Ui::NavigationRail* m_navRail;
    QStackedWidget* m_contentStack;
    QPushButton* m_themeToggle;
    QLabel* m_versionLabel;
};

#endif // UI_MAINWINDOW_H
