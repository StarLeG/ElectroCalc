// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "navigation.h"
#include "util/constants.h"
#include <QPushButton>
#include <QVBoxLayout>
#include <QLabel>
#include <QIcon>

namespace Ui {

NavigationRail::NavigationRail(QWidget *parent)
    : QFrame(parent)
    , m_collapsed(true)
{
    setObjectName("NavRail");
    m_layout = new QVBoxLayout(this);
    m_layout->setContentsMargins(Constants::Spacing8, Constants::Spacing12,
                                 Constants::Spacing8, Constants::Spacing12);
    m_layout->setSpacing(Constants::Spacing4);
    m_layout->addStretch();
}

void NavigationRail::setGroups(const QVector<NavGroup>& groups)
{
    m_groups = groups;

    // Очистить старые кнопки
    for (auto* btn : m_buttons) {
        m_layout->removeWidget(btn);
        delete btn;
    }
    m_buttons.clear();

    // Удалить stretch
    if (m_layout->count() > 0) {
        QLayoutItem* item = m_layout->takeAt(m_layout->count() - 1);
        delete item;
    }

    // Создать кнопки для каждой группы
    for (const auto& group : m_groups) {
        // Заголовок группы (только в развёрнутом режиме)
        auto* label = new QLabel(group.title, this);
        label->setObjectName("NavGroupLabel");
        label->setVisible(!m_collapsed);
        m_layout->addWidget(label);

        for (const auto& item : group.items) {
            auto* btn = new QPushButton(this);
            btn->setObjectName("NavButton");
            btn->setCheckable(true);
            btn->setToolTip(item.tooltip);

            if (!item.iconPath.isEmpty()) {
                btn->setIcon(QIcon(item.iconPath));
                btn->setIconSize(QSize(20, 20));
            }

            if (!m_collapsed) {
                btn->setText(item.text);
            }

            connect(btn, &QPushButton::clicked, this, [this, index = item.tabIndex]() {
                emit tabRequested(index);
            });

            m_layout->addWidget(btn);
            m_buttons.append(btn);
        }
    }

    m_layout->addStretch();
    updateButtons();
}

void NavigationRail::toggleCollapse()
{
    m_collapsed = !m_collapsed;
    setFixedWidth(m_collapsed ? Constants::NavRailWidthCollapsed
                              : Constants::NavRailWidthExpanded);
    updateButtons();
}

void NavigationRail::updateButtons()
{
    int idx = 0;
    for (const auto& group : m_groups) {
        // Пропустить заголовок группы
        if (auto* label = qobject_cast<QLabel*>(m_layout->itemAt(idx)->widget())) {
            label->setVisible(!m_collapsed);
            ++idx;
        }

        for (const auto& item : group.items) {
            if (idx < m_buttons.size()) {
                m_buttons[idx]->setText(m_collapsed ? "" : item.text);
                ++idx;
            }
        }
    }
}

} // namespace Ui
