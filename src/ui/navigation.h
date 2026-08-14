// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UI_NAVIGATION_H
#define UI_NAVIGATION_H

#include <QFrame>
#include <QVector>

class QPushButton;
class QVBoxLayout;

namespace Ui {

/// Элемент навигации
struct NavItem {
    QString iconPath;
    QString text;
    QString tooltip;
    int tabIndex;
};

/// Группа навигации
struct NavGroup {
    QString title;
    QVector<NavItem> items;
};

/// Навигационный рельс (сворачиваемый)
class NavigationRail : public QFrame
{
    Q_OBJECT

public:
    explicit NavigationRail(QWidget *parent = nullptr);

    /// Установить группы навигации
    void setGroups(const QVector<NavGroup>& groups);

    /// Свёрнут/развёрнут
    bool isCollapsed() const { return m_collapsed; }

    /// Переключить состояние
    void toggleCollapse();

signals:
    void tabRequested(int index);

private:
    void updateButtons();

    bool m_collapsed = true;
    QVector<NavGroup> m_groups;
    QVector<QPushButton*> m_buttons;
    QVBoxLayout* m_layout;
};

} // namespace Ui

#endif // UI_NAVIGATION_H
