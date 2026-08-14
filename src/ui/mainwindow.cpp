// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "mainwindow.h"
#include "navigation.h"
#include "tabs/powertab.h"
#include "tabs/cabletab.h"
#include "tabs/voltagedroptab.h"
#include "tabs/shortcircuittab.h"
#include "tabs/groundingtab.h"
#include "tabs/thermaltab.h"
#include "tabs/energytab.h"
#include "tabs/protectiontab.h"
#include "referencebrowser.h"
#include "util/theme.h"
#include "util/constants.h"
#include "version.h"

#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QStackedWidget>
#include <QLabel>
#include <QPushButton>
#include <QFrame>
#include <QStatusBar>
#include <QApplication>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , m_theme(new Util::Theme)
    , m_navRail(nullptr)
    , m_contentStack(nullptr)
    , m_themeToggle(nullptr)
    , m_versionLabel(nullptr)
{
    setupUI();
    applyTheme();
}

MainWindow::~MainWindow()
{
    delete m_theme;
}

void MainWindow::setupUI()
{
    auto* central = new QWidget(this);
    auto* mainLayout = new QHBoxLayout(central);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    // Навигационный рельс
    m_navRail = new Ui::NavigationRail(this);
    setupNavigation();

    // Правая часть
    auto* rightPanel = new QWidget(this);
    auto* rightLayout = new QVBoxLayout(rightPanel);
    rightLayout->setContentsMargins(0, 0, 0, 0);
    rightLayout->setSpacing(0);

    // Верхняя панель
    auto* topBar = new QFrame(rightPanel);
    topBar->setObjectName("TopBar");
    auto* topLayout = new QHBoxLayout(topBar);
    topLayout->setContentsMargins(24, 0, 24, 0);

    auto* logoE = new QLabel("Engi", topBar);
    logoE->setObjectName("Logo");
    auto* logoCalc = new QLabel("Calc", topBar);
    logoCalc->setObjectName("LogoAccent");

    auto* breadcrumb = new QLabel("Электрика / Мощность и ток", topBar);
    breadcrumb->setStyleSheet(
        "font-size: 13px; color: #9AA4B2; background: transparent; border: none; padding: 0;");

    // Кнопки в правой части
    auto* langBtn = new QPushButton("RU / EN", topBar);
    langBtn->setStyleSheet(
        "background: transparent; color: #9AA4B2; border: 1px solid #3A414D;"
        "border-radius: 6px; padding: 6px 12px; font-size: 12px;");

    m_themeToggle = new QPushButton("☀", topBar);
    m_themeToggle->setObjectName("NavButton");
    m_themeToggle->setFixedSize(36, 36);
    m_themeToggle->setToolTip("Переключить тему");
    connect(m_themeToggle, &QPushButton::clicked, this, &MainWindow::onThemeToggle);

    topLayout->addWidget(logoE);
    topLayout->addWidget(logoCalc);
    topLayout->addSpacing(24);
    topLayout->addWidget(breadcrumb);
    topLayout->addStretch();
    topLayout->addWidget(langBtn);
    topLayout->addSpacing(8);
    topLayout->addWidget(m_themeToggle);

    rightLayout->addWidget(topBar);

    // Стек контента
    m_contentStack = new QStackedWidget(rightPanel);

    // Вкладки калькуляторов
    m_contentStack->addWidget(new Ui::PowerTab(rightPanel));          // 0: Мощность
    m_contentStack->addWidget(new Ui::CableTab(rightPanel));          // 1: Кабели
    m_contentStack->addWidget(new Ui::VoltageDropTab(rightPanel));    // 2: Потери
    m_contentStack->addWidget(new Ui::ShortCircuitTab(rightPanel));   // 3: КЗ
    m_contentStack->addWidget(new Ui::GroundingTab(rightPanel));      // 4: Заземление
    m_contentStack->addWidget(new Ui::ThermalTab(rightPanel));        // 5: Тепловые
    m_contentStack->addWidget(new Ui::EnergyTab(rightPanel));         // 6: Энергия
    m_contentStack->addWidget(new Ui::ProtectionTab(rightPanel));     // 7: Защита

    // Заглушки для КИПиА
    for (int i = 8; i <= 9; ++i) {
        auto* stub = new QWidget(rightPanel);
        auto* stubLayout = new QVBoxLayout(stub);
        stubLayout->setAlignment(Qt::AlignCenter);
        auto* stubLabel = new QLabel(QString("Вкладка %1 — в разработке").arg(i), stub);
        stubLabel->setAlignment(Qt::AlignCenter);
        stubLabel->setStyleSheet("font-size: 18px; color: #9AA4B2;");
        stubLayout->addWidget(stubLabel);
        m_contentStack->addWidget(stub);
    }

    // Справочник (таблица кабелей, конвертер, справочник)
    m_contentStack->addWidget(new Ui::ReferenceBrowser(rightPanel)); // 10: Справка

    rightLayout->addWidget(m_contentStack);

    mainLayout->addWidget(m_navRail);
    mainLayout->addWidget(rightPanel);

    setCentralWidget(central);

    // Статус-бар
    setupStatusBar();
}

void MainWindow::setupNavigation()
{
    using Ui::NavGroup;
    using Ui::NavItem;

    QVector<NavGroup> groups = {
        { "Электрика", {
            {":/icons/lightning.svg",    "Мощность", "Мощность и ток",    0},
            {":/icons/cable.svg",        "Кабели",   "Подбор сечения",    1},
            {":/icons/gauge.svg",        "Потери",   "Потери напряжения", 2},
            {":/icons/transformer.svg",  "КЗ",       "Токи КЗ",           3},
            {":/icons/ground.svg",       "Заземл.",  "Заземление",        4},
            {":/icons/shield.svg",       "Защита",   "Автозащита",        5}
        }},
        { "КИПиА", {
            {":/icons/signal.svg",       "4–20 мА",    "Токовая петля",   6},
            {":/icons/gauge.svg",        "Масштаб",    "Масштабирование", 7},
            {":/icons/thermometer.svg",  "Температ.",  "RTD/термопары",   8}
        }},
        { "Проект", {
            {":/icons/report.svg",       "Отчёт",      "Экспорт отчёта",  9},
            {":/icons/book.svg",         "Справка",     "Справочник",     10}
        }}
    };

    m_navRail->setGroups(groups);

    connect(m_navRail, &Ui::NavigationRail::tabRequested,
            this, &MainWindow::onTabRequested);
}

void MainWindow::setupStatusBar()
{
    auto* statusBar = new QStatusBar(this);
    statusBar->setObjectName("StatusBar");

    auto* hintLabel = new QLabel("Готово", this);

    auto* cosPhiLabel = new QLabel("cos φ: 0.85", this);
    cosPhiLabel->setStyleSheet("color: #9AA4B2; font-size: 11px;");

    m_versionLabel = new QLabel(
        QString("v%1 (%2)").arg(APP_VERSION_STRING, APP_GIT_VERSION), this);

    statusBar->addWidget(hintLabel, 1);
    statusBar->addPermanentWidget(cosPhiLabel);
    statusBar->addPermanentWidget(m_versionLabel);

    setStatusBar(statusBar);
}

void MainWindow::onThemeToggle()
{
    m_theme->toggle();
    applyTheme();
    m_themeToggle->setText(m_theme->mode() == Util::ThemeMode::Dark ? "☀" : "☾");
}

void MainWindow::onTabRequested(int index)
{
    if (index >= 0 && index < m_contentStack->count()) {
        m_contentStack->setCurrentIndex(index);
    }
}

void MainWindow::applyTheme()
{
    qApp->setStyleSheet(m_theme->mainStyle());
}
