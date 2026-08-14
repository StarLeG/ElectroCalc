// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <gtest/gtest.h>
#include "version.h"

TEST(SmokeTest, VersionStringNotEmpty)
{
    EXPECT_FALSE(std::string(APP_VERSION_STRING).empty());
}

TEST(SmokeTest, VersionMajorIsOne)
{
    EXPECT_EQ(APP_VERSION_MAJOR, 1);
}

TEST(SmokeTest, GitVersionDefined)
{
    EXPECT_FALSE(std::string(APP_GIT_VERSION).empty());
}
