// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include "util/unitconverter.h"

using namespace Util;

// === Температура ===

TEST(UnitConverter, CelsiusToFahrenheit)
{
    EXPECT_NEAR(UnitConverter::celsiusToFahrenheit(0), 32.0, 0.01);
    EXPECT_NEAR(UnitConverter::celsiusToFahrenheit(100), 212.0, 0.01);
    EXPECT_NEAR(UnitConverter::celsiusToFahrenheit(-40), -40.0, 0.01);
}

TEST(UnitConverter, FahrenheitToCelsius)
{
    EXPECT_NEAR(UnitConverter::fahrenheitToCelsius(32), 0.0, 0.01);
    EXPECT_NEAR(UnitConverter::fahrenheitToCelsius(212), 100.0, 0.01);
}

TEST(UnitConverter, CelsiusToKelvin)
{
    EXPECT_NEAR(UnitConverter::celsiusToKelvin(0), 273.15, 0.01);
    EXPECT_NEAR(UnitConverter::celsiusToKelvin(-273.15), 0.0, 0.01);
}

// === Мощность ===

TEST(UnitConverter, KwToHP)
{
    EXPECT_NEAR(UnitConverter::kwToHP(1.0), 1.341, 0.01);
    EXPECT_NEAR(UnitConverter::kwToHP(7.5), 10.06, 0.01);
}

TEST(UnitConverter, HpToKW)
{
    EXPECT_NEAR(UnitConverter::hpToKW(1.0), 0.7457, 0.01);
}

TEST(UnitConverter, KvaToKw)
{
    EXPECT_NEAR(UnitConverter::kvaToKw(100, 0.8), 80.0, 0.01);
    EXPECT_NEAR(UnitConverter::kvaToKw(100, 1.0), 100.0, 0.01);
    EXPECT_DOUBLE_EQ(UnitConverter::kvaToKw(100, 0), 0);
}

TEST(UnitConverter, KwToKva)
{
    EXPECT_NEAR(UnitConverter::kwToKva(80, 0.8), 100.0, 0.01);
}

TEST(UnitConverter, WattsToDBm)
{
    EXPECT_NEAR(UnitConverter::wattsToDBm(1.0), 30.0, 0.01);
    EXPECT_NEAR(UnitConverter::wattsToDBm(0.001), 0.0, 0.01);
}

TEST(UnitConverter, DBmToWatts)
{
    EXPECT_NEAR(UnitConverter::dbmToWatts(30), 1.0, 0.01);
    EXPECT_NEAR(UnitConverter::dbmToWatts(0), 0.001, 0.0001);
}

// === Давление ===

TEST(UnitConverter, MpaToBar)
{
    EXPECT_NEAR(UnitConverter::mpaToBar(1.0), 10.0, 0.01);
    EXPECT_NEAR(UnitConverter::mpaToBar(0.1), 1.0, 0.01);
}

TEST(UnitConverter, BarToMpa)
{
    EXPECT_NEAR(UnitConverter::barToMpa(10), 1.0, 0.01);
}

TEST(UnitConverter, KpaToPsi)
{
    EXPECT_NEAR(UnitConverter::kpaToPsi(101.325), 14.7, 0.1);
}

// === Расход ===

TEST(UnitConverter, M3hToLmin)
{
    EXPECT_NEAR(UnitConverter::m3hToLmin(1.0), 16.667, 0.01);
    EXPECT_NEAR(UnitConverter::m3hToLmin(6.0), 100.0, 0.01);
}

TEST(UnitConverter, LminToM3h)
{
    EXPECT_NEAR(UnitConverter::lminToM3h(100), 6.0, 0.01);
}

// === Длина ===

TEST(UnitConverter, MmToInch)
{
    EXPECT_NEAR(UnitConverter::mmToInch(25.4), 1.0, 0.01);
    EXPECT_NEAR(UnitConverter::mmToInch(100), 3.937, 0.01);
}

TEST(UnitConverter, InchToMm)
{
    EXPECT_NEAR(UnitConverter::inchToMm(1), 25.4, 0.01);
}

// === Сечение ===

TEST(UnitConverter, Mm2ToAwg)
{
    // 2.5 мм² ≈ 14 AWG
    int awg = static_cast<int>(UnitConverter::mm2ToAwg(2.5));
    EXPECT_GE(awg, 13);
    EXPECT_LE(awg, 15);
}

// === Справочники ===

TEST(UnitConverter, StandardSections_NotEmpty)
{
    EXPECT_GE(UnitConverter::standardSections().size(), 10);
}

TEST(UnitConverter, ResistivityTable_NotEmpty)
{
    EXPECT_GE(UnitConverter::resistivityTable().size(), 3);
}

TEST(UnitConverter, IPTable_NotEmpty)
{
    EXPECT_GE(UnitConverter::ipTable().size(), 5);
}

TEST(UnitConverter, WireColorCodes_NotEmpty)
{
    EXPECT_GE(UnitConverter::wireColorCodes().size(), 5);
}
