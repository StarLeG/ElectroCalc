// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UTIL_CONSTANTS_H
#define UTIL_CONSTANTS_H

namespace Constants {

// === Размеры компонентов ===
constexpr int NavRailWidthCollapsed = 64;
constexpr int NavRailWidthExpanded  = 232;
constexpr int TopBarHeight          = 56;
constexpr int StatusBarHeight       = 28;
constexpr int CardMinWidth          = 360;

// === Отступы (4-point scale) ===
constexpr int Spacing4  = 4;
constexpr int Spacing8  = 8;
constexpr int Spacing12 = 12;
constexpr int Spacing16 = 16;
constexpr int Spacing24 = 24;
constexpr int Spacing32 = 32;

// === Радиусы скругления ===
constexpr int RadiusCard   = 10;
constexpr int RadiusInput  = 6;
constexpr int RadiusPill   = 999;

// === Размеры шрифтов ===
constexpr int FontCaption  = 11;
constexpr int FontBody     = 13;
constexpr int FontLabel    = 13;
constexpr int FontSubtitle = 16;
constexpr int FontTitle    = 20;
constexpr int FontResult   = 30;

// === Анимации (мс) ===
constexpr int AnimHover   = 150;
constexpr int AnimPanel   = 200;
constexpr int AnimResult  = 400;

} // namespace Constants

#endif // UTIL_CONSTANTS_H
