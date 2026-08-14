// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include <QVector>
#include "core/grounding.h"

using namespace Core;

// === Одиночный стержневой электрод ===

TEST(GroundingCalculator, SingleRod_Positive)
{
    auto result = GroundingCalculator::singleRod(100, 3, 0.02);
    EXPECT_GT(result.resistance, 0);
    EXPECT_EQ(result.electrodes, 1);
    EXPECT_FALSE(result.normativeRef.isEmpty());
}

TEST(GroundingCalculator, SingleRod_InvalidResistivity)
{
    EXPECT_THROW(GroundingCalculator::singleRod(0, 3, 0.02), std::invalid_argument);
}

TEST(GroundingCalculator, SingleRod_InvalidLength)
{
    EXPECT_THROW(GroundingCalculator::singleRod(100, 0, 0.02), std::invalid_argument);
}

// === Одиночный полосовый электрод ===

TEST(GroundingCalculator, SingleStrip_Positive)
{
    auto result = GroundingCalculator::singleStrip(100, 10, 0.04, 0.5);
    EXPECT_GT(result.resistance, 0);
}

TEST(GroundingCalculator, SingleStrip_InvalidWidth)
{
    EXPECT_THROW(GroundingCalculator::singleStrip(100, 10, 0, 0.5), std::invalid_argument);
}

// === Контурный электрод ===

TEST(GroundingCalculator, MultipleElectrodes_Positive)
{
    auto result = GroundingCalculator::multipleElectrodes(30, 4, 0.7);
    EXPECT_GT(result.resistance, 0);
    EXPECT_LT(result.resistance, 30);
    EXPECT_EQ(result.electrodes, 4);
}

TEST(GroundingCalculator, MultipleElectrodes_InvalidCount)
{
    EXPECT_THROW(GroundingCalculator::multipleElectrodes(30, 0, 0.7), std::invalid_argument);
}

// === Подбор числа электродов ===

TEST(GroundingCalculator, SelectElectrodeCount_Positive)
{
    int count = GroundingCalculator::selectElectrodeCount(4, 30, 0.7);
    EXPECT_GE(count, 1);
}

TEST(GroundingCalculator, SelectElectrodeCount_InvalidRequired)
{
    EXPECT_THROW(GroundingCalculator::selectElectrodeCount(0, 30, 0.7), std::invalid_argument);
}

// === Таблица грунтов ===

TEST(GroundingCalculator, SoilTable_NotEmpty)
{
    auto table = GroundingCalculator::soilTable();
    EXPECT_GE(table.size(), 5);
    EXPECT_GT(table[0].resistivity, 0);
}
