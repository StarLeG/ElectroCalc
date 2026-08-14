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

static void applyTokens(QString& qss, const ColorTokens& t)
{
    using namespace Constants;
    qss.replace("$BG_BASE$",       t.bgBase);
    qss.replace("$BG_SURFACE$",    t.bgSurface);
    qss.replace("$BG_ELEVATED$",   t.bgElevated);
    qss.replace("$BG_INPUT$",      t.bgInput);
    qss.replace("$BORDER$",        t.border);
    qss.replace("$ACCENT$",        t.accent);
    qss.replace("$ACCENT_HOVER$",  t.accentHover);
    qss.replace("$ACCENT2$",       t.accent2);
    qss.replace("$RESULT$",        t.result);
    qss.replace("$WARN$",          t.warn);
    qss.replace("$ERROR$",         t.error);
    qss.replace("$TEXT$",          t.text);
    qss.replace("$TEXT_MUTED$",    t.textMuted);
    qss.replace("$TEXT_ON_ACC$",   t.textOnAccent);
    qss.replace("$FONT_BODY$",     QString::number(FontBody));
    qss.replace("$FONT_CAP$",      QString::number(FontCaption));
    qss.replace("$FONT_SUB$",      QString::number(FontSubtitle));
    qss.replace("$FONT_TITLE$",    QString::number(FontTitle));
    qss.replace("$FONT_RESULT$",   QString::number(FontResult));
    qss.replace("$RADIUS_PILL$",   QString::number(RadiusPill));
    qss.replace("$RADIUS_CARD$",   QString::number(RadiusCard));
    qss.replace("$RADIUS_INPUT$",  QString::number(RadiusInput));
    qss.replace("$SP4$",           QString::number(Spacing4));
    qss.replace("$SP8$",           QString::number(Spacing8));
    qss.replace("$SP12$",          QString::number(Spacing12));
    qss.replace("$SP16$",          QString::number(Spacing16));
    qss.replace("$SP24$",          QString::number(Spacing24));
    qss.replace("$SP32$",          QString::number(Spacing32));
    qss.replace("$TOP_BAR_H$",     QString::number(TopBarHeight));
    qss.replace("$STATUS_BAR_H$",  QString::number(StatusBarHeight));
}

QString Theme::generateMainQSS(const ColorTokens& t) const
{
    QString qss = R"(
/* === Global === */
QWidget {
    background-color: $BG_BASE$;
    color: $TEXT$;
    font-family: 'Segoe UI', sans-serif;
    font-size: $FONT_BODY$px;
}

QMainWindow {
    background-color: $BG_BASE$;
}

/* === Navigation Rail === */
QFrame#NavRail {
    background-color: $BG_SURFACE$;
    border-right: 1px solid $BORDER$;
}

QPushButton#NavButton {
    background: transparent;
    border: none;
    border-radius: $RADIUS_PILL$px;
    padding: $SP8$px;
    color: $TEXT_MUTED$;
    font-size: $FONT_BODY$px;
    min-width: 40px;
    min-height: 40px;
}

QPushButton#NavButton:hover {
    background-color: $BG_ELEVATED$;
    color: $TEXT$;
}

QPushButton#NavButton:checked {
    background-color: $BG_ELEVATED$;
    color: $ACCENT$;
    border-left: 3px solid $ACCENT$;
}

QFrame#NavDivider {
    background-color: $BORDER$;
    max-height: 1px;
}

/* === Top Bar === */
QFrame#TopBar {
    background-color: $BG_SURFACE$;
    border-bottom: 1px solid $BORDER$;
    min-height: $TOP_BAR_H$px;
    max-height: $TOP_BAR_H$px;
}

QLabel#Logo {
    font-size: $FONT_TITLE$px;
    font-weight: 700;
    color: $TEXT$;
}

QLabel#LogoAccent {
    font-size: $FONT_TITLE$px;
    font-weight: 700;
    color: $ACCENT$;
}

/* === Status Bar === */
QStatusBar {
    background-color: $BG_SURFACE$;
    border-top: 1px solid $BORDER$;
    min-height: $STATUS_BAR_H$px;
    max-height: $STATUS_BAR_H$px;
    color: $TEXT_MUTED$;
    font-size: $FONT_CAP$px;
}

QStatusBar QLabel {
    color: $TEXT_MUTED$;
    font-size: $FONT_CAP$px;
}

/* === Cards === */
QFrame#Card {
    background-color: $BG_SURFACE$;
    border: 1px solid $BORDER$;
    border-radius: $RADIUS_CARD$px;
}

/* === Input Fields === */
QLineEdit, QDoubleSpinBox, QComboBox {
    background-color: $BG_INPUT$;
    border: 1px solid $BORDER$;
    border-radius: $RADIUS_INPUT$px;
    padding: $SP8$px $SP12$px;
    color: $TEXT$;
    font-size: $FONT_BODY$px;
}

QLineEdit:focus, QDoubleSpinBox:focus, QComboBox:focus {
    border: 1px solid $ACCENT$;
}

/* === Buttons === */
QPushButton#Primary {
    background-color: $ACCENT$;
    color: $TEXT_ON_ACC$;
    border: none;
    border-radius: $RADIUS_INPUT$px;
    padding: $SP8$px $SP24$px;
    font-weight: 600;
    font-size: $FONT_BODY$px;
}

QPushButton#Primary:hover {
    background-color: $ACCENT_HOVER$;
}

QPushButton#Secondary {
    background: transparent;
    color: $ACCENT$;
    border: 1px solid $ACCENT$;
    border-radius: $RADIUS_INPUT$px;
    padding: $SP8$px $SP24$px;
    font-size: $FONT_BODY$px;
}

QPushButton#Secondary:hover {
    background-color: $BG_ELEVATED$;
}

QPushButton#Ghost {
    background: transparent;
    color: $TEXT_MUTED$;
    border: none;
    border-radius: $RADIUS_INPUT$px;
    padding: $SP8$px $SP16$px;
    font-size: $FONT_BODY$px;
}

QPushButton#Ghost:hover {
    color: $TEXT$;
    background-color: $BG_ELEVATED$;
}

/* === Result Display === */
QLabel#ResultValue {
    font-family: 'Consolas', monospace;
    font-size: $FONT_RESULT$px;
    font-weight: 700;
    color: $RESULT$;
}

QLabel#ResultUnit {
    color: $TEXT_MUTED$;
    font-size: $FONT_BODY$px;
}

QLabel#ResultLabel {
    color: $TEXT_MUTED$;
    font-size: $FONT_CAP$px;
}

/* === Normative Reference === */
QFrame#NormativePanel {
    background-color: $BG_ELEVATED$;
    border: 1px solid $BORDER$;
    border-radius: $RADIUS_INPUT$px;
    padding: $SP12$px;
}

QLabel#NormativeText {
    color: $TEXT_MUTED$;
    font-size: $FONT_CAP$px;
    font-style: italic;
}

/* === Tables === */
QTableView {
    background-color: $BG_SURFACE$;
    alternate-background-color: $BG_ELEVATED$;
    border: 1px solid $BORDER$;
    border-radius: $RADIUS_INPUT$px;
    gridline-color: $BORDER$;
    color: $TEXT$;
}

QHeaderView::section {
    background-color: $BG_SURFACE$;
    color: $TEXT_MUTED$;
    border: none;
    border-bottom: 1px solid $BORDER$;
    padding: $SP8$px;
    font-weight: 600;
}

/* === Tab Widget === */
QTabBar::tab {
    background: transparent;
    color: $TEXT_MUTED$;
    border: none;
    border-bottom: 2px solid transparent;
    padding: $SP8$px $SP24$px;
    font-size: $FONT_BODY$px;
}

QTabBar::tab:hover {
    color: $TEXT$;
}

QTabBar::tab:selected {
    color: $ACCENT$;
    border-bottom: 2px solid $ACCENT$;
}

/* === Scroll Bar === */
QScrollBar:vertical {
    background: transparent;
    width: 8px;
}

QScrollBar::handle:vertical {
    background-color: $BORDER$;
    border-radius: 4px;
    min-height: 32px;
}

QScrollBar::handle:vertical:hover {
    background-color: $TEXT_MUTED$;
}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0;
}
)";

    applyTokens(qss, t);
    return qss;
}

QString Theme::generateLandingQSS(const ColorTokens& t) const
{
    using namespace Constants;
    QString qss = R"(
QWidget#LandingPage {
    background-color: $BG_BASE$;
}

QLabel#LandingTitle {
    font-size: 48px;
    font-weight: 700;
    color: $TEXT$;
}

QLabel#LandingSubtitle {
    font-size: $FONT_SUB$px;
    color: $TEXT_MUTED$;
}

QPushButton#LandingPrimary {
    background-color: $ACCENT$;
    color: $TEXT_ON_ACC$;
    border: none;
    border-radius: $RADIUS_INPUT$px;
    padding: $SP16$px $SP32$px;
    font-size: $FONT_SUB$px;
    font-weight: 600;
}

QPushButton#LandingPrimary:hover {
    background-color: $ACCENT_HOVER$;
}

QPushButton#LandingSecondary {
    background: transparent;
    color: $ACCENT$;
    border: 2px solid $ACCENT$;
    border-radius: $RADIUS_INPUT$px;
    padding: $SP16$px $SP32$px;
    font-size: $FONT_SUB$px;
}

QPushButton#LandingSecondary:hover {
    background-color: $BG_ELEVATED$;
}

QFrame#FeatureCard {
    background-color: $BG_SURFACE$;
    border: 1px solid $BORDER$;
    border-radius: $RADIUS_CARD$px;
    padding: $SP24$px;
}
)";

    applyTokens(qss, t);
    return qss;
}

} // namespace Util
