// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include "core/short_circuit.h"
#include <cmath>

using namespace Core;

// === Базовый расчёт КЗ ===

TEST(ShortCircuitCalculator, Calculate_Positive)
{
    auto result = ShortCircuitCalculator::calculate(380, 0.1);
    EXPECT_GT(result.current, 0);
    EXPECT_DOUBLE_EQ(result.impedance, 0.1);
    EXPECT_FALSE(result.normativeRef.isEmpty());
}

TEST(ShortCircuitCalculator, Calculate_InvalidVoltage)
{
    EXPECT_THROW(ShortCircuitCalculator::calculate(0, 0.1), std::invalid_argument);
}

TEST(ShortCircuitCalculator, Calculate_InvalidImpedance)
{
    EXPECT_THROW(ShortCircuitCalculator::calculate(380, 0), std::invalid_argument);
}

// === Расчёт от трансформатора ===

TEST(ShortCircuitCalculator, FromTransformer_Positive)
{
    auto result = ShortCircuitCalculator::fromTransformer(100, 5);
    EXPECT_DOUBLE_EQ(result.current, 2000);
    EXPECT_FALSE(result.normativeRef.isEmpty());
}

TEST(ShortCircuitCalculator, FromTransformer_InvalidNominalCurrent)
{
    EXPECT_THROW(ShortCircuitCalculator::fromTransformer(0, 5), std::invalid_argument);
}

TEST(ShortCircuitCalculator, FromTransformer_InvalidShortCircuitVoltage)
{
    EXPECT_THROW(ShortCircuitCalculator::fromTransformer(100, 0), std::invalid_argument);
    EXPECT_THROW(ShortCircuitCalculator::fromTransformer(100, 150), std::invalid_argument);
}

// === Метод приведённых длин ===

TEST(ShortCircuitCalculator, EquivalentLength_Positive)
{
    auto result = ShortCircuitCalculator::equivalentLength(380, 0.05, 100, 0.1);
    EXPECT_GT(result.current, 0);
    EXPECT_GT(result.impedance, 0.05);
}

TEST(ShortCircuitCalculator, EquivalentLength_InvalidLineLength)
{
    EXPECT_THROW(ShortCircuitCalculator::equivalentLength(380, 0.05, 0, 0.1),
                 std::invalid_argument);
}
