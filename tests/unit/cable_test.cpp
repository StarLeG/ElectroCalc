// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include "core/cable.h"

using namespace Core;

// === Подбор по нагреву ===

TEST(CableCalculator, SelectByHeating_Cu_Positive)
{
    auto result = CableCalculator::selectByHeating(25, "Cu");
    EXPECT_GE(result.maxCurrent, 25);
    EXPECT_GT(result.crossSection, 0);
    EXPECT_FALSE(result.normativeRef.isEmpty());
}

TEST(CableCalculator, SelectByHeating_Al_Positive)
{
    auto result = CableCalculator::selectByHeating(20, "Al");
    EXPECT_GE(result.maxCurrent, 20);
}

TEST(CableCalculator, SelectByHeating_InvalidCurrent)
{
    EXPECT_THROW(CableCalculator::selectByHeating(0, "Cu"), std::invalid_argument);
}

TEST(CableCalculator, SelectByHeating_InvalidMaterial)
{
    EXPECT_THROW(CableCalculator::selectByHeating(25, "Gold"), std::invalid_argument);
}

// === Проверка по 4 критериям ===

TEST(CableCalculator, CheckAllCriteria_Positive)
{
    auto result = CableCalculator::checkAllCriteria(20, 4.0, 50, 220, 5.0, "Cu");
    EXPECT_TRUE(result.meetsHeating);
    EXPECT_GT(result.crossSection, 0);
}

TEST(CableCalculator, CheckAllCriteria_InvalidCrossSection)
{
    EXPECT_THROW(CableCalculator::checkAllCriteria(20, 0, 50, 220, 5.0, "Cu"),
                 std::invalid_argument);
}

// === Диаметр по сечению ===

TEST(CableCalculator, DiameterFromSection_Positive)
{
    EXPECT_NEAR(CableCalculator::diameterFromSection(4.0), 2.26, 0.01);
    EXPECT_NEAR(CableCalculator::diameterFromSection(10.0), 3.57, 0.01);
}

TEST(CableCalculator, DiameterFromSection_InvalidSection)
{
    EXPECT_THROW(CableCalculator::diameterFromSection(0), std::invalid_argument);
}

// === Таблица кабелей ===

TEST(CableCalculator, CableTable_NotEmpty)
{
    auto table = CableCalculator::cableTable();
    EXPECT_GE(table.size(), 10);
    EXPECT_GT(table[0].crossSection, 0);
}
