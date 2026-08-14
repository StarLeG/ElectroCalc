// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UTIL_THEME_H
#define UTIL_THEME_H

#include <QString>
#include <QColor>

namespace Util {

/// Режим темы
enum class ThemeMode {
    Dark,
    Light
};

/// Цветовые токены design-system
struct ColorTokens {
    QString bgBase;
    QString bgSurface;
    QString bgElevated;
    QString bgInput;
    QString border;
    QString accent;
    QString accentHover;
    QString accent2;
    QString result;
    QString warn;
    QString error;
    QString text;
    QString textMuted;
    QString textOnAccent;
};

/// Генератор QSS из цветовых токенов
class Theme
{
public:
    Theme();

    /// Текущий режим темы
    ThemeMode mode() const { return m_mode; }

    /// Переключить тему
    void setMode(ThemeMode mode);

    /// Переключить на противоположную тему
    void toggle();

    /// Получить QSS для основного интерфейса
    QString mainStyle() const;

    /// Получить QSS для лендинга
    QString landingStyle() const;

    /// Получить цветовые токены текущей темы
    ColorTokens tokens() const;

    /// Получить конкретный цвет по имени
    QString color(const QString& name) const;

private:
    ThemeMode m_mode;

    ColorTokens darkTokens() const;
    ColorTokens lightTokens() const;
    QString generateMainQSS(const ColorTokens& t) const;
    QString generateLandingQSS(const ColorTokens& t) const;
};

} // namespace Util

#endif // UTIL_THEME_H
