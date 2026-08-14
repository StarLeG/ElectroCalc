// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include <QVector>
#include "core/protection.h"

using namespace Core;

// === Подбор автомата ===

TEST(ProtectionCalculator, SelectBreaker_C_Positive)
{
    double rating = ProtectionCalculator::selectBreaker(10, "C");
    EXPECT_GE(rating, 15); // 10 * 1.5 = 15
}

TEST(ProtectionCalculator, SelectBreaker_B_Positive)
{
    double rating = ProtectionCalculator::selectBreaker(10, "B");
    EXPECT_GE(rating, 13); // 10 * 1.3 = 13
}

TEST(ProtectionCalculator, SelectBreaker_D_Positive)
{
    double rating = ProtectionCalculator::selectBreaker(10, "D");
    EXPECT_GE(rating, 20); // 10 * 2.0 = 20
}

TEST(ProtectionCalculator, SelectBreaker_InvalidCurrent)
{
    EXPECT_THROW(ProtectionCalculator::selectBreaker(0, "C"), std::invalid_argument);
}

TEST(ProtectionCalculator, SelectBreaker_InvalidCharacteristic)
{
    EXPECT_THROW(ProtectionCalculator::selectBreaker(10, "A"), std::invalid_argument);
}

// === Подбор УЗО ===

TEST(ProtectionCalculator, SelectRCD_Positive)
{
    double rcd = ProtectionCalculator::selectRCD(10);
    EXPECT_GE(rcd, 30); // 10 * 3 = 30
}

TEST(ProtectionCalculator, SelectRCD_InvalidLeakage)
{
    EXPECT_THROW(ProtectionCalculator::selectRCD(0), std::invalid_argument);
}

// === Проверка селективности ===

TEST(ProtectionCalculator, CheckSelectivity_True)
{
    EXPECT_TRUE(ProtectionCalculator::checkSelectivity(63, 25));
}

TEST(ProtectionCalculator, CheckSelectivity_False)
{
    EXPECT_FALSE(ProtectionCalculator::checkSelectivity(32, 25));
}

TEST(ProtectionCalculator, CheckSelectivity_InvalidCurrent)
{
    EXPECT_THROW(ProtectionCalculator::checkSelectivity(0, 25), std::invalid_argument);
}

// === Стандартные номиналы ===

TEST(ProtectionCalculator, StandardBreakerRatings_NotEmpty)
{
    auto ratings = ProtectionCalculator::standardBreakerRatings();
    EXPECT_GE(ratings.size(), 10);
    EXPECT_EQ(ratings[0], 6);
}

TEST(ProtectionCalculator, StandardRCDRatings_NotEmpty)
{
    auto ratings = ProtectionCalculator::standardRCDRatings();
    EXPECT_GE(ratings.size(), 3);
    EXPECT_EQ(ratings[0], 10);
}
