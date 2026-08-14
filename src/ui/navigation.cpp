// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "navigation.h"
#include "util/constants.h"
#include <QPushButton>
#include <QVBoxLayout>
#include <QLabel>
#include <QIcon>
#include <QScrollArea>
#include <QFrame>

namespace Ui {

NavigationRail::NavigationRail(QWidget *parent)
    : QFrame(parent)
{
    setObjectName("NavRail");
    setFixedWidth(Constants::NavRailWidthCollapsed);

    auto* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    auto* scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    scrollArea->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    scrollArea->setFrameShape(QFrame::NoFrame);
    scrollArea->setStyleSheet("background: transparent;");

    auto* scrollWidget = new QWidget();
    scrollWidget->setStyleSheet("background: transparent;");
    m_layout = new QVBoxLayout(scrollWidget);
    m_layout->setContentsMargins(6, 12, 6, 12);
    m_layout->setSpacing(2);
    m_layout->addStretch();

    scrollArea->setWidget(scrollWidget);
    mainLayout->addWidget(scrollArea);
}

void NavigationRail::setGroups(const QVector<NavGroup>& groups)
{
    // Полностью очистить все старые виджеты
    QLayoutItem* item;
    while ((item = m_layout->takeAt(0)) != nullptr) {
        if (item->widget()) {
            delete item->widget();
        }
        delete item;
    }
    m_buttons.clear();
    m_labels.clear();
    m_dividers.clear();

    // Создать кнопки для каждой группы
    for (int g = 0; g < groups.size(); ++g) {
        const auto& group = groups[g];

        // Разделитель между группами
        if (g > 0) {
            auto* divider = new QFrame(this);
            divider->setObjectName("NavDivider");
            divider->setFrameShape(QFrame::HLine);
            divider->setFixedHeight(1);
            divider->setStyleSheet("background: #3A414D; margin: 6px 8px;");
            m_layout->addSpacing(6);
            m_layout->addWidget(divider);
            m_layout->addSpacing(6);
            m_dividers.append(divider);
        }

        for (const auto& navItem : group.items) {
            auto* btn = new QPushButton(this);
            btn->setObjectName("NavButton");
            btn->setCheckable(true);
            btn->setToolTip(navItem.tooltip);
            btn->setFixedSize(48, 48);

            if (!navItem.iconPath.isEmpty()) {
                btn->setIcon(QIcon(navItem.iconPath));
                btn->setIconSize(QSize(22, 22));
            }

            connect(btn, &QPushButton::clicked, this, [this, index = navItem.tabIndex, btn]() {
                for (auto* b : m_buttons) {
                    b->setChecked(false);
                }
                btn->setChecked(true);
                emit tabRequested(index);
            });

            m_layout->addWidget(btn, 0, Qt::AlignHCenter);
            m_buttons.append(btn);
        }
    }

    m_layout->addStretch();

    // Выделить первую кнопку
    if (!m_buttons.isEmpty()) {
        m_buttons[0]->setChecked(true);
    }
}

} // namespace Ui
