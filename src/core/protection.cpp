// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "protection.h"
#include <QVector>
#include <cmath>
#include <stdexcept>

namespace Core {

double ProtectionCalculator::selectBreaker(double loadCurrent, const QString& characteristic)
{
    if (loadCurrent <= 0)
        throw std::invalid_argument("Ток нагрузки должен быть положительным");
    if (characteristic != "B" && characteristic != "C" && characteristic != "D")
        throw std::invalid_argument("Характеристика должна быть 'B', 'C' или 'D'");

    // Коэффициент запаса в зависимости от характеристики
    double factor = 1.0;
    if (characteristic == "B") factor = 1.3;
    else if (characteristic == "C") factor = 1.5;
    else if (characteristic == "D") factor = 2.0;

    double required = loadCurrent * factor;

    // Подбор ближайшего стандартного номинала
    auto ratings = standardBreakerRatings();
    for (double rating : ratings) {
        if (rating >= required)
            return rating;
    }

    throw std::runtime_error("Не удалось подобрать автомат — ток слишком велик");
}

double ProtectionCalculator::selectRCD(double leakageCurrent)
{
    if (leakageCurrent <= 0)
        throw std::invalid_argument("Ток утечки должен быть положительным");

    // Номинальный дифференциальный ток УЗО ≥ 3 * Iут
    double required = leakageCurrent * 3.0;

    auto ratings = standardRCDRatings();
    for (double rating : ratings) {
        if (rating >= required)
            return rating;
    }

    throw std::runtime_error("Не удалось подобрать УЗО");
}

bool ProtectionCalculator::checkSelectivity(double upstreamCurrent, double downstreamCurrent)
{
    if (upstreamCurrent <= 0 || downstreamCurrent <= 0)
        throw std::invalid_argument("Токи должны быть положительными");

    // Селективность обеспечивается, если Iвв > 1.6 * Iгр
    return upstreamCurrent > 1.6 * downstreamCurrent;
}

QVector<double> ProtectionCalculator::standardBreakerRatings()
{
    return { 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125 };
}

QVector<double> ProtectionCalculator::standardRCDRatings()
{
    return { 10, 30, 100, 300 };
}

} // namespace Core
