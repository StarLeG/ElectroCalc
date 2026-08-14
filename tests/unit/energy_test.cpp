// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include "core/energy.h"

using namespace Core;

// === Энергия в кВт·ч ===

TEST(EnergyCalculator, EnergyKWh_Positive)
{
    auto result = EnergyCalculator::energyKWh(2.0, 5.0);
    EXPECT_DOUBLE_EQ(result.energyKWh, 10.0);
    EXPECT_NEAR(result.energyJoules, 36000000, 0.01);
    EXPECT_FALSE(result.normativeRef.isEmpty());
}

TEST(EnergyCalculator, EnergyKWh_ZeroPower)
{
    auto result = EnergyCalculator::energyKWh(0, 5.0);
    EXPECT_DOUBLE_EQ(result.energyKWh, 0);
}

TEST(EnergyCalculator, EnergyKWh_InvalidPower)
{
    EXPECT_THROW(EnergyCalculator::energyKWh(-1, 5.0), std::invalid_argument);
}

// === Энергия в Джоулях ===

TEST(EnergyCalculator, EnergyJoules_Positive)
{
    auto result = EnergyCalculator::energyJoules(220, 10, 3600);
    EXPECT_NEAR(result.energyJoules, 7920000, 0.01);
    EXPECT_NEAR(result.energyKWh, 2.2, 0.01);
}

TEST(EnergyCalculator, EnergyJoules_InvalidVoltage)
{
    EXPECT_THROW(EnergyCalculator::energyJoules(0, 10, 3600), std::invalid_argument);
}

// === Стоимость ===

TEST(EnergyCalculator, Cost_Positive)
{
    double cost = EnergyCalculator::cost(100, 0.5, 30);
    EXPECT_DOUBLE_EQ(cost, 1500.0);
}

TEST(EnergyCalculator, Cost_InvalidTariff)
{
    EXPECT_THROW(EnergyCalculator::cost(100, -0.5, 30), std::invalid_argument);
}

// === Средняя мощность ===

TEST(EnergyCalculator, AveragePower_Positive)
{
    double power = EnergyCalculator::averagePower(100, 24);
    EXPECT_NEAR(power, 4.17, 0.01);
}

TEST(EnergyCalculator, AveragePower_InvalidHours)
{
    EXPECT_THROW(EnergyCalculator::averagePower(100, 0), std::invalid_argument);
}
