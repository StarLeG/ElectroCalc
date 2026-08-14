// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "mainwindow.h"
#include "navigation.h"
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
    // Центральный виджет
    auto* central = new QWidget(this);
    auto* mainLayout = new QHBoxLayout(central);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    // Навигационный рельс
    m_navRail = new Ui::NavigationRail(this);
    m_navRail->setFixedWidth(Constants::NavRailWidthCollapsed);
    setupNavigation();

    // Правая часть (контент)
    auto* rightPanel = new QWidget(this);
    auto* rightLayout = new QVBoxLayout(rightPanel);
    rightLayout->setContentsMargins(0, 0, 0, 0);
    rightLayout->setSpacing(0);

    // Верхняя панель
    setupTopBar();

    // Стек контента
    m_contentStack = new QStackedWidget(this);
    auto* placeholder = new QLabel("Выберите раздел в навигации", this);
    placeholder->setAlignment(Qt::AlignCenter);
    m_contentStack->addWidget(placeholder);

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
            {":/icons/lightning.svg", "Мощность и ток", "Расчёт мощности и тока", 0},
            {":/icons/cable.svg", "Кабели", "Подбор сечения кабелей", 1},
            {":/icons/gauge.svg", "Потери", "Потери напряжения", 2},
            {":/icons/lightning.svg", "КЗ", "Токи короткого замыкания", 3},
            {":/icons/gauge.svg", "Заземление", "Расчёт заземления", 4},
            {":/icons/gauge.svg", "Тепловые", "Тепловые расчёты", 5},
            {":/icons/lightning.svg", "Энергия", "Энергия и стоимость", 6},
            {":/icons/gauge.svg", "Защита", "Автоматическая защита", 7}
        }},
        { "КИПиА", {
            {":/icons/gauge.svg", "Токовая петля", "4–20 мА", 8},
            {":/icons/gauge.svg", "Масштабирование", "Сигналы", 9},
            {":/icons/gauge.svg", "Температура", "RTD и термопары", 10}
        }},
        { "Справочник", {
            {":/icons/cable.svg", "Кабели", "Таблицы кабелей", 11},
            {":/icons/gauge.svg", "Единицы", "Конвертер единиц", 12}
        }},
        { "Проект", {
            {":/icons/app_icon.svg", "Отчёт", "Генерация отчёта", 13},
            {":/icons/app_icon.svg", "Сохранить", "Сохранить проект", 14}
        }}
    };

    m_navRail->setGroups(groups);

    connect(m_navRail, &Ui::NavigationRail::tabRequested,
            this, &MainWindow::onTabRequested);
}

void MainWindow::setupTopBar()
{
    auto* topBar = new QFrame(this);
    topBar->setObjectName("TopBar");

    auto* layout = new QHBoxLayout(topBar);
    layout->setContentsMargins(Constants::Spacing16, 0, Constants::Spacing16, 0);

    // Логотип
    auto* logoE = new QLabel("Engi", this);
    logoE->setObjectName("Logo");
    auto* logoCalc = new QLabel("Calc", this);
    logoCalc->setObjectName("LogoAccent");

    // Хлебные крошки
    auto* breadcrumb = new QLabel("Электрика > Мощность и ток", this);
    breadcrumb->setObjectName("Breadcrumb");

    // Переключатель темы
    m_themeToggle = new QPushButton("☀", this);
    m_themeToggle->setObjectName("NavButton");
    m_themeToggle->setToolTip("Переключить тему");
    connect(m_themeToggle, &QPushButton::clicked, this, &MainWindow::onThemeToggle);

    layout->addWidget(logoE);
    layout->addWidget(logoCalc);
    layout->addSpacing(Constants::Spacing24);
    layout->addWidget(breadcrumb);
    layout->addStretch();
    layout->addWidget(m_themeToggle);

    // Добавить в layout (будет добавлен в setupUI)
    topBar->setParent(this);
    if (auto* central = centralWidget()) {
        if (auto* mainLayout = central->layout()) {
            if (auto* rightPanel = mainLayout->itemAt(1)->widget()) {
                if (auto* rightLayout = rightPanel->layout()) {
                    rightLayout->addWidget(topBar);
                }
            }
        }
    }
}

void MainWindow::setupStatusBar()
{
    auto* statusBar = new QStatusBar(this);
    statusBar->setObjectName("StatusBar");

    auto* hintLabel = new QLabel("Готово", this);
    m_versionLabel = new QLabel(
        QString("v%1 (%2)").arg(APP_VERSION_STRING, APP_GIT_VERSION), this);
    m_versionLabel->setObjectName("VersionLabel");

    statusBar->addWidget(hintLabel, 1);
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
