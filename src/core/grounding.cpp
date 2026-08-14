// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "grounding.h"
#include <QVector>
#include <cmath>
#include <stdexcept>

namespace Core {

GroundingResult GroundingCalculator::singleRod(double resistivity, double length,
                                               double diameter)
{
    if (resistivity <= 0)
        throw std::invalid_argument("Удельное сопротивление должно быть положительным");
    if (length <= 0)
        throw std::invalid_argument("Длина должна быть положительной");
    if (diameter <= 0)
        throw std::invalid_argument("Диаметр должен быть положительным");

    double pi = M_PI;
    double resistance = resistivity / (2.0 * pi * length) * std::log(4.0 * length / diameter);

    return {
        resistance,
        1,
        1.0,
        "ПУЭ п. 1.7.16 — сопротивление одиночного стержневого электрода"
    };
}

GroundingResult GroundingCalculator::singleStrip(double resistivity, double length,
                                                  double width, double depth)
{
    if (resistivity <= 0)
        throw std::invalid_argument("Удельное сопротивление должно быть положительным");
    if (length <= 0)
        throw std::invalid_argument("Длина должна быть положительной");
    if (width <= 0)
        throw std::invalid_argument("Ширина должна быть положительной");
    if (depth <= 0)
        throw std::invalid_argument("Глубина должна быть положительной");

    double pi = M_PI;
    double resistance = resistivity / (2.0 * pi * length) * std::log(2.0 * length * length / (width * depth));

    return {
        resistance,
        1,
        1.0,
        "ПУЭ п. 1.7.16 — сопротивление одиночного полосового электрода"
    };
}

GroundingResult GroundingCalculator::multipleElectrodes(double singleResistance,
                                                        int count,
                                                        double utilizationCoeff)
{
    if (singleResistance <= 0)
        throw std::invalid_argument("Сопротивление должно быть положительным");
    if (count <= 0)
        throw std::invalid_argument("Количество электродов должно быть положительным");
    if (utilizationCoeff <= 0.0 || utilizationCoeff > 1.0)
        throw std::invalid_argument("Коэффициент использования должен быть от 0.0 до 1.0");

    double resistance = singleResistance / (count * utilizationCoeff);

    return {
        resistance,
        count,
        utilizationCoeff,
        "ПУЭ п. 1.7.16 — сопротивление контурного заземлителя"
    };
}

int GroundingCalculator::selectElectrodeCount(double requiredResistance,
                                              double singleResistance,
                                              double utilizationCoeff)
{
    if (requiredResistance <= 0)
        throw std::invalid_argument("Требуемое сопротивление должно быть положительным");
    if (singleResistance <= 0)
        throw std::invalid_argument("Сопротивление должно быть положительным");
    if (utilizationCoeff <= 0.0 || utilizationCoeff > 1.0)
        throw std::invalid_argument("Коэффициент использования должен быть от 0.0 до 1.0");

    // n = Rод / (Rтреб * η)
    double count = singleResistance / (requiredResistance * utilizationCoeff);
    return static_cast<int>(std::ceil(count));
}

QVector<SoilData> GroundingCalculator::soilTable()
{
    return {
        { "Песок сухой",           1000 },
        { "Песок влажный",          500 },
        { "Супесь",                 300 },
        { "Суглинок",               100 },
        { "Глина",                   50 },
        { "Чернозём",                30 },
        { "Торф",                    25 },
        { "Грунт с галькой",        800 },
        { "Грунт с щебнем",         600 }
    };
}

} // namespace Core
