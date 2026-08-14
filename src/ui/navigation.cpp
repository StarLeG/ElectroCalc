// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "navigation.h"
#include "util/constants.h"
#include <QPushButton>
#include <QHBoxLayout>
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
    setFixedWidth(Constants::NavRailWidthExpanded);

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
    m_layout->setContentsMargins(8, 12, 8, 12);
    m_layout->setSpacing(2);
    m_layout->addStretch();

    scrollArea->setWidget(scrollWidget);
    mainLayout->addWidget(scrollArea);
}

void NavigationRail::setGroups(const QVector<NavGroup>& groups)
{
    // Очистить все старые виджеты
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

        // Заголовок группы
        if (g > 0) {
            m_layout->addSpacing(8);
            auto* divider = new QFrame(this);
            divider->setObjectName("NavDivider");
            divider->setFrameShape(QFrame::HLine);
            divider->setFixedHeight(1);
            divider->setStyleSheet("background: #3A414D; margin: 4px 0;");
            m_layout->addWidget(divider);
            m_layout->addSpacing(4);
        }

        auto* groupLabel = new QLabel(group.title, this);
        groupLabel->setStyleSheet(
            "font-size: 10px; font-weight: 600; color: #64748B;"
            "text-transform: uppercase; letter-spacing: 1px;"
            "padding: 4px 12px 2px 12px; background: transparent;");
        m_layout->addWidget(groupLabel);
        m_labels.append(groupLabel);

        for (const auto& navItem : group.items) {
            auto* btn = new QPushButton(this);
            btn->setObjectName("NavButton");
            btn->setCheckable(true);
            btn->setToolTip(navItem.tooltip);
            btn->setMinimumHeight(40);
            btn->setStyleSheet(
                "QPushButton#NavButton {"
                "  background: transparent; border: none; border-radius: 8px;"
                "  padding: 8px 12px; color: #9AA4B2; font-size: 13px;"
                "  text-align: left;"
                "}"
                "QPushButton#NavButton:hover {"
                "  background: #2E343F; color: #E6EAF0;"
                "}"
                "QPushButton#NavButton:checked {"
                "  background: #2E343F; color: #FFB300;"
                "  border-left: 3px solid #FFB300;"
                "}");

            if (!navItem.iconPath.isEmpty()) {
                btn->setIcon(QIcon(navItem.iconPath));
                btn->setIconSize(QSize(18, 18));
            }

            btn->setText(navItem.text);

            connect(btn, &QPushButton::clicked, this, [this, index = navItem.tabIndex, btn]() {
                for (auto* b : m_buttons) {
                    b->setChecked(false);
                }
                btn->setChecked(true);
                emit tabRequested(index);
            });

            m_layout->addWidget(btn);
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
