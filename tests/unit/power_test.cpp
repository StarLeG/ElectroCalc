// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include "core/power.h"

using namespace Core;

// === Однофазный расчёт тока ===

TEST(PowerCalculator, SinglePhaseCurrent_Positive)
{
    auto result = PowerCalculator::singlePhaseCurrent(2200, 220, 0.9);
    EXPECT_NEAR(result.current, 11.11, 0.01);
    EXPECT_DOUBLE_EQ(result.power, 2200);
    EXPECT_FALSE(result.normativeRef.isEmpty());
}

TEST(PowerCalculator, SinglePhaseCurrent_WithEfficiency)
{
    auto result = PowerCalculator::singlePhaseCurrent(2200, 220, 0.9, 0.85);
    EXPECT_NEAR(result.current, 13.07, 0.01);
}

TEST(PowerCalculator, SinglePhaseCurrent_InvalidPower)
{
    EXPECT_THROW(PowerCalculator::singlePhaseCurrent(0, 220, 0.9), std::invalid_argument);
    EXPECT_THROW(PowerCalculator::singlePhaseCurrent(-100, 220, 0.9), std::invalid_argument);
}

TEST(PowerCalculator, SinglePhaseCurrent_InvalidVoltage)
{
    EXPECT_THROW(PowerCalculator::singlePhaseCurrent(2200, 0, 0.9), std::invalid_argument);
}

TEST(PowerCalculator, SinglePhaseCurrent_InvalidCosPhi)
{
    EXPECT_THROW(PowerCalculator::singlePhaseCurrent(2200, 220, 0.05), std::invalid_argument);
    EXPECT_THROW(PowerCalculator::singlePhaseCurrent(2200, 220, 1.1), std::invalid_argument);
}

// === Трёхфазный расчёт тока ===

TEST(PowerCalculator, ThreePhaseCurrent_Positive)
{
    auto result = PowerCalculator::threePhaseCurrent(10000, 380, 0.85);
    EXPECT_NEAR(result.current, 17.87, 0.01);
    EXPECT_DOUBLE_EQ(result.power, 10000);
}

TEST(PowerCalculator, ThreePhaseCurrent_InvalidPower)
{
    EXPECT_THROW(PowerCalculator::threePhaseCurrent(0, 380, 0.85), std::invalid_argument);
}

// === Расчёт мощности по току ===

TEST(PowerCalculator, SinglePhasePower_Positive)
{
    auto result = PowerCalculator::singlePhasePower(10, 220, 0.9);
    EXPECT_NEAR(result.power, 1980, 0.01);
}

TEST(PowerCalculator, ThreePhasePower_Positive)
{
    auto result = PowerCalculator::threePhasePower(10, 380, 0.9);
    EXPECT_NEAR(result.power, 5923.61, 1.0);
}

// === Полная и реактивная мощность ===

TEST(PowerCalculator, ApparentPower_Positive)
{
    EXPECT_NEAR(PowerCalculator::apparentPower(1000, 0.8), 1250, 0.01);
}

TEST(PowerCalculator, ReactivePower_Positive)
{
    EXPECT_NEAR(PowerCalculator::reactivePower(1000, 0.6), 1333.33, 0.01);
}

TEST(PowerCalculator, ApparentPower_InvalidCosPhi)
{
    EXPECT_THROW(PowerCalculator::apparentPower(1000, 0), std::invalid_argument);
}
