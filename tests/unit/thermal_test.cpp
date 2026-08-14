// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include "core/thermal.h"

using namespace Core;

// === Выделение теплоты ===

TEST(ThermalCalculator, HeatGeneration_Positive)
{
    auto result = ThermalCalculator::heatGeneration(10, 0.1, 60);
    EXPECT_NEAR(result.heat, 600.0, 0.01);
    EXPECT_FALSE(result.normativeRef.isEmpty());
}

TEST(ThermalCalculator, HeatGeneration_InvalidCurrent)
{
    EXPECT_THROW(ThermalCalculator::heatGeneration(0, 0.1, 60), std::invalid_argument);
}

TEST(ThermalCalculator, HeatGeneration_InvalidTime)
{
    EXPECT_THROW(ThermalCalculator::heatGeneration(10, 0.1, 0), std::invalid_argument);
}

// === Изменение температуры ===

TEST(ThermalCalculator, TemperatureChange_Positive)
{
    double deltaT = ThermalCalculator::temperatureChange(4200, 2, 2100);
    EXPECT_NEAR(deltaT, 1.0, 0.01);
}

TEST(ThermalCalculator, TemperatureChange_InvalidHeat)
{
    EXPECT_THROW(ThermalCalculator::temperatureChange(0, 2, 2100), std::invalid_argument);
}

TEST(ThermalCalculator, TemperatureChange_InvalidMass)
{
    EXPECT_THROW(ThermalCalculator::temperatureChange(4200, 0, 2100), std::invalid_argument);
}

// === Ток плавки ===

TEST(ThermalCalculator, MeltingCurrent_Cu)
{
    double current = ThermalCalculator::meltingCurrent(4.0, "Cu", 1.0);
    EXPECT_GT(current, 0);
    EXPECT_NEAR(current, 300, 1.0); // 150 * √4 / √1 = 300
}

TEST(ThermalCalculator, MeltingCurrent_Al)
{
    double current = ThermalCalculator::meltingCurrent(4.0, "Al", 1.0);
    EXPECT_GT(current, 0);
    EXPECT_NEAR(current, 200, 1.0); // 100 * √4 / √1 = 200
}

TEST(ThermalCalculator, MeltingCurrent_InvalidMaterial)
{
    EXPECT_THROW(ThermalCalculator::meltingCurrent(4.0, "Gold", 1.0), std::invalid_argument);
}

// === Удельное сопротивление ===

TEST(ThermalCalculator, Resistivity_Cu)
{
    EXPECT_NEAR(ThermalCalculator::resistivity("Cu"), 0.0175, 0.001);
}

TEST(ThermalCalculator, Resistivity_Al)
{
    EXPECT_NEAR(ThermalCalculator::resistivity("Al"), 0.028, 0.001);
}

TEST(ThermalCalculator, Resistivity_InvalidMaterial)
{
    EXPECT_THROW(ThermalCalculator::resistivity("Gold"), std::invalid_argument);
}
