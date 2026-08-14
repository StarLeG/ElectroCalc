// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include "core/voltage_drop.h"

using namespace Core;

// === Однофазный расчёт ===

TEST(VoltageDropCalculator, SinglePhase_Positive)
{
    auto result = VoltageDropCalculator::singlePhase(10, 100, 7.24, 0.08, 0.9, 220);
    EXPECT_GT(result.dropVolts, 0);
    EXPECT_GT(result.dropPercent, 0);
    EXPECT_LT(result.voltageAtEnd, 220);
    EXPECT_FALSE(result.normativeRef.isEmpty());
}

TEST(VoltageDropCalculator, SinglePhase_InvalidCurrent)
{
    EXPECT_THROW(VoltageDropCalculator::singlePhase(0, 100, 7.24, 0.08, 0.9, 220),
                 std::invalid_argument);
}

// === Трёхфазный расчёт ===

TEST(VoltageDropCalculator, ThreePhase_Positive)
{
    auto result = VoltageDropCalculator::threePhase(10, 100, 7.24, 0.08, 0.9, 380);
    EXPECT_GT(result.dropVolts, 0);
    EXPECT_GT(result.dropPercent, 0);
    EXPECT_LT(result.voltageAtEnd, 380);
}

TEST(VoltageDropCalculator, ThreePhase_InvalidVoltage)
{
    EXPECT_THROW(VoltageDropCalculator::threePhase(10, 100, 7.24, 0.08, 0.9, 0),
                 std::invalid_argument);
}

// === Упрощённый расчёт ===

TEST(VoltageDropCalculator, Simple_SinglePhase)
{
    auto result = VoltageDropCalculator::simple(10, 100, 7.24, 220, false);
    EXPECT_GT(result.dropVolts, 0);
}

TEST(VoltageDropCalculator, Simple_ThreePhase)
{
    auto result = VoltageDropCalculator::simple(10, 100, 7.24, 380, true);
    EXPECT_GT(result.dropVolts, 0);
}

TEST(VoltageDropCalculator, Simple_InvalidLength)
{
    EXPECT_THROW(VoltageDropCalculator::simple(10, 0, 7.24, 220), std::invalid_argument);
}
