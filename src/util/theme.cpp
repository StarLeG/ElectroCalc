// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "theme.h"
#include "constants.h"

namespace Util {

Theme::Theme()
    : m_mode(ThemeMode::Dark)
{
}

void Theme::setMode(ThemeMode mode)
{
    m_mode = mode;
}

void Theme::toggle()
{
    m_mode = (m_mode == ThemeMode::Dark) ? ThemeMode::Light : ThemeMode::Dark;
}

ColorTokens Theme::tokens() const
{
    return (m_mode == ThemeMode::Dark) ? darkTokens() : lightTokens();
}

QString Theme::color(const QString& name) const
{
    auto t = tokens();
    if (name == "bg-base")       return t.bgBase;
    if (name == "bg-surface")    return t.bgSurface;
    if (name == "bg-elevated")   return t.bgElevated;
    if (name == "bg-input")      return t.bgInput;
    if (name == "border")        return t.border;
    if (name == "accent")        return t.accent;
    if (name == "accent-hover")  return t.accentHover;
    if (name == "accent-2")      return t.accent2;
    if (name == "result")        return t.result;
    if (name == "warn")          return t.warn;
    if (name == "error")         return t.error;
    if (name == "text")          return t.text;
    if (name == "text-muted")    return t.textMuted;
    if (name == "text-on-accent") return t.textOnAccent;
    return t.text;
}

ColorTokens Theme::darkTokens() const
{
    return {
        "#1E2128",  // bgBase
        "#252A33",  // bgSurface
        "#2E343F",  // bgElevated
        "#1A1D23",  // bgInput
        "#3A414D",  // border
        "#FFB300",  // accent
        "#FFC94D",  // accentHover
        "#38BDF8",  // accent2
        "#22E88A",  // result
        "#FF9F43",  // warn
        "#FF5D5D",  // error
        "#E6EAF0",  // text
        "#9AA4B2",  // textMuted
        "#12151A"   // textOnAccent
    };
}

ColorTokens Theme::lightTokens() const
{
    return {
        "#F4F6FA",  // bgBase
        "#FFFFFF",  // bgSurface
        "#F0F2F5",  // bgElevated
        "#FFFFFF",  // bgInput
        "#E2E8F0",  // border
        "#E39A00",  // accent
        "#F0AD00",  // accentHover
        "#0284C7",  // accent2
        "#0E9F6E",  // result
        "#D97706",  // warn
        "#E02424",  // error
        "#1A2230",  // text
        "#64748B",  // textMuted
        "#FFFFFF"   // textOnAccent
    };
}

QString Theme::mainStyle() const
{
    return generateMainQSS(tokens());
}

QString Theme::landingStyle() const
{
    return generateLandingQSS(tokens());
}

QString Theme::generateMainQSS(const ColorTokens& t) const
{
    using namespace Constants;

    return QString(R"(
/* === Global === */
QWidget {
    background-color: %1;
    color: %11;
    font-family: 'Roboto', 'Segoe UI', sans-serif;
    font-size: %15px;
}

/* === Main Window === */
QMainWindow {
    background-color: %1;
}

/* === Navigation Rail === */
QFrame#NavRail {
    background-color: %2;
    border-right: 1px solid %4;
}

QPushButton#NavButton {
    background: transparent;
    border: none;
    border-radius: %16px;
    padding: %17px;
    color: %12;
    font-size: %15px;
}

QPushButton#NavButton:hover {
    background-color: %3;
    color: %11;
}

QPushButton#NavButton:checked {
    background-color: %3;
    color: %5;
    border-left: 3px solid %5;
}

/* === Top Bar === */
QFrame#TopBar {
    background-color: %2;
    border-bottom: 1px solid %4;
    min-height: %18px;
    max-height: %18px;
}

QLabel#Logo {
    font-size: %19px;
    font-weight: 700;
    color: %11;
}

QLabel#LogoAccent {
    color: %5;
}

/* === Status Bar === */
QStatusBar {
    background-color: %2;
    border-top: 1px solid %4;
    min-height: %20px;
    max-height: %20px;
    color: %12;
    font-size: %21px;
}

/* === Cards === */
QFrame#Card {
    background-color: %2;
    border: 1px solid %4;
    border-radius: %22px;
}

/* === Input Fields === */
QLineEdit, QDoubleSpinBox, QComboBox {
    background-color: %3;
    border: 1px solid %4;
    border-radius: %23px;
    padding: %17px %24px;
    color: %11;
    font-size: %15px;
}

QLineEdit:focus, QDoubleSpinBox:focus, QComboBox:focus {
    border: 1px solid %5;
}

QLineEdit:invalid {
    border: 1px solid %10;
}

/* === Buttons === */
QPushButton#Primary {
    background-color: %5;
    color: %13;
    border: none;
    border-radius: %23px;
    padding: %17px %24px;
    font-weight: 600;
    font-size: %15px;
}

QPushButton#Primary:hover {
    background-color: %6;
}

QPushButton#Primary:pressed {
    background-color: %5;
}

QPushButton#Secondary {
    background: transparent;
    color: %5;
    border: 1px solid %5;
    border-radius: %23px;
    padding: %17px %24px;
    font-size: %15px;
}

QPushButton#Secondary:hover {
    background-color: %3;
}

QPushButton#Ghost {
    background: transparent;
    color: %12;
    border: none;
    border-radius: %23px;
    padding: %17px %24px;
    font-size: %15px;
}

QPushButton#Ghost:hover {
    color: %11;
    background-color: %3;
}

/* === Result Display === */
QLabel#ResultValue {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: %25px;
    font-weight: 700;
    color: %8;
}

QLabel#ResultUnit {
    color: %12;
    font-size: %15px;
}

QLabel#ResultLabel {
    color: %12;
    font-size: %21px;
}

/* === Normative Reference === */
QFrame#NormativePanel {
    background-color: %3;
    border: 1px solid %4;
    border-radius: %23px;
    padding: %17px;
}

QLabel#NormativeText {
    color: %12;
    font-size: %21px;
    font-style: italic;
}

/* === Tables === */
QTableView {
    background-color: %2;
    alternate-background-color: %3;
    border: 1px solid %4;
    border-radius: %23px;
    gridline-color: %4;
    color: %11;
}

QHeaderView::section {
    background-color: %2;
    color: %12;
    border: none;
    border-bottom: 1px solid %4;
    padding: %17px;
    font-weight: 600;
}

/* === Group Box === */
QGroupBox {
    background-color: %2;
    border: 1px solid %4;
    border-radius: %22px;
    margin-top: %24px;
    padding-top: %24px;
    font-weight: 600;
    color: %11;
}

QGroupBox::title {
    subcontrol-origin: margin;
    left: %24px;
    padding: 0 %17px;
}

/* === Tool Tips === */
QToolTip {
    background-color: %3;
    color: %11;
    border: 1px solid %4;
    border-radius: %23px;
    padding: %17px;
}

/* === Scroll Bar === */
QScrollBar:vertical {
    background: transparent;
    width: 8px;
    margin: 0;
}

QScrollBar::handle:vertical {
    background-color: %4;
    border-radius: 4px;
    min-height: 32px;
}

QScrollBar::handle:vertical:hover {
    background-color: %12;
}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0;
}

QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {
    background: transparent;
}

/* === Tab Widget === */
QTabWidget::pane {
    border: 1px solid %4;
    border-radius: %22px;
    background-color: %2;
}

QTabBar::tab {
    background: transparent;
    color: %12;
    border: none;
    border-bottom: 2px solid transparent;
    padding: %17px %24px;
    font-size: %15px;
}

QTabBar::tab:hover {
    color: %11;
}

QTabBar::tab:selected {
    color: %5;
    border-bottom: 2px solid %5;
}

/* === Combo Box Drop-down === */
QComboBox::drop-down {
    border: none;
    width: 24px;
}

QComboBox QAbstractItemView {
    background-color: %3;
    border: 1px solid %4;
    color: %11;
    selection-background-color: %5;
    selection-color: %13;
}
)")
    .arg(t.bgBase)        // %1
    .arg(t.bgSurface)     // %2
    .arg(t.bgElevated)    // %3
    .arg(t.border)        // %4
    .arg(t.accent)        // %5
    .arg(t.accentHover)   // %6
    .arg(t.accent2)       // %7
    .arg(t.result)        // %8
    .arg(t.warn)          // %9
    .arg(t.error)         // %10
    .arg(t.text)          // %11
    .arg(t.textMuted)     // %12
    .arg(t.textOnAccent)  // %13
    .arg(0)               // %14 (unused)
    .arg(FontBody)        // %15
    .arg(RadiusPill)      // %16
    .arg(Spacing8)        // %17
    .arg(TopBarHeight)    // %18
    .arg(FontTitle)       // %19
    .arg(StatusBarHeight) // %20
    .arg(FontCaption)     // %21
    .arg(RadiusCard)      // %22
    .arg(RadiusInput)     // %23
    .arg(Spacing12)       // %24
    .arg(FontResult);     // %25
}

QString Theme::generateLandingQSS(const ColorTokens& t) const
{
    using namespace Constants;

    return QString(R"(
/* === Landing Page === */
QWidget#LandingPage {
    background-color: %1;
}

QLabel#LandingTitle {
    font-size: 48px;
    font-weight: 700;
    color: %11;
}

QLabel#LandingSubtitle {
    font-size: %19px;
    color: %12;
}

QLabel#LandingFeature {
    font-size: %15px;
    color: %12;
}

QPushButton#LandingPrimary {
    background-color: %5;
    color: %13;
    border: none;
    border-radius: %3px;
    padding: %2px %4px;
    font-size: %19px;
    font-weight: 600;
}

QPushButton#LandingPrimary:hover {
    background-color: %6;
}

QPushButton#LandingSecondary {
    background: transparent;
    color: %5;
    border: 2px solid %5;
    border-radius: %3px;
    padding: %2px %4px;
    font-size: %19px;
}

QPushButton#LandingSecondary:hover {
    background-color: %7;
}

QFrame#FeatureCard {
    background-color: %7;
    border: 1px solid %8;
    border-radius: %9px;
    padding: %10px;
}

QLabel#FeatureTitle {
    font-size: %11px;
    font-weight: 600;
    color: %12;
}

QLabel#DonateText {
    font-size: %15px;
    color: %12;
}
)")
    .arg(t.bgBase)        // %1
    .arg(Spacing16)       // %2
    .arg(RadiusInput)     // %3
    .arg(Spacing32)       // %4
    .arg(t.accent)        // %5
    .arg(t.accentHover)   // %6
    .arg(t.bgSurface)     // %7
    .arg(t.border)        // %8
    .arg(RadiusCard)      // %9
    .arg(Spacing24)       // %10
    .arg(FontSubtitle)    // %11
    .arg(t.text)          // %12
    .arg(t.textOnAccent)  // %13
    .arg(FontBody)        // %14
    .arg(FontCaption)     // %15
    .arg(t.bgElevated)    // %16
    .arg(t.textMuted);    // %17
}

} // namespace Util
