// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UI_NAVIGATION_H
#define UI_NAVIGATION_H

#include <QFrame>
#include <QVector>

class QPushButton;
class QVBoxLayout;
class QLabel;

namespace Ui {

struct NavItem {
    QString iconPath;
    QString text;
    QString tooltip;
    int tabIndex;
};

struct NavGroup {
    QString title;
    QVector<NavItem> items;
};

class NavigationRail : public QFrame
{
    Q_OBJECT

public:
    explicit NavigationRail(QWidget *parent = nullptr);
    void setGroups(const QVector<NavGroup>& groups);

signals:
    void tabRequested(int index);

private:
    QVector<QPushButton*> m_buttons;
    QVector<QLabel*> m_labels;
    QVector<QFrame*> m_dividers;
    QVBoxLayout* m_layout;
};

} // namespace Ui

#endif // UI_NAVIGATION_H
