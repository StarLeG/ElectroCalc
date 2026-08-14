// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "accuracy.h"
#include <cmath>
#include <stdexcept>
#include <numeric>
namespace Kipia {
AccuracyResult AccuracyCalculator::fromClass(double accuracyClass, double range)
{
    if (accuracyClass <= 0) throw std::invalid_argument("Класс > 0");
    if (range <= 0) throw std::invalid_argument("Диапазон > 0");

    double absErr = accuracyClass * range / 100.0;
    double relErr = accuracyClass; // при измерении = диапазон

    return { absErr, relErr, accuracyClass, 0.0,
             "ГОСТ 8.401 — классы точности средств измерений" };
}

double AccuracyCalculator::reducedToRelative(double reducedError, double range, double value)
{
    if (range <= 0) throw std::invalid_argument("Диапазон > 0");
    if (value <= 0) throw std::invalid_argument("Значение > 0");
    return reducedError * range / (100.0 * value);
}

double AccuracyCalculator::combineErrors(const QVector<double>& errors)
{
    if (errors.isEmpty()) return 0;
    double sumSq = 0;
    for (double e : errors) sumSq += e * e;
    return std::sqrt(sumSq);
}

double AccuracyCalculator::adcResolution(double range, int bits)
{
    if (range <= 0) throw std::invalid_argument("Диапазон > 0");
    if (bits <= 0) throw std::invalid_argument("Разрядность > 0");
    return range / std::pow(2, bits);
}
} // namespace Kipia
