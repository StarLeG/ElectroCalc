// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "power.h"
#include <cmath>
#include <stdexcept>

namespace Core {

const double PowerCalculator::SQRT3 = std::sqrt(3.0);

PowerResult PowerCalculator::singlePhaseCurrent(double power, double voltage,
                                                double cosPhi, double efficiency)
{
    if (power <= 0)
        throw std::invalid_argument("Мощность должна быть положительной");
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");
    if (cosPhi < 0.1 || cosPhi > 1.0)
        throw std::invalid_argument("cosφ должен быть от 0.1 до 1.0");
    if (efficiency <= 0.0 || efficiency > 1.0)
        throw std::invalid_argument("КПД должен быть от 0.0 до 1.0");

    double current = power / (voltage * cosPhi * efficiency);
    double apparent = apparentPower(power, cosPhi);
    double reactive = reactivePower(power, cosPhi);

    return {
        power,
        current,
        apparent,
        reactive,
        "ПУЭ п. 1.3.10 — расчёт тока однофазной нагрузки"
    };
}

PowerResult PowerCalculator::threePhaseCurrent(double power, double voltage,
                                               double cosPhi, double efficiency)
{
    if (power <= 0)
        throw std::invalid_argument("Мощность должна быть положительной");
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");
    if (cosPhi < 0.1 || cosPhi > 1.0)
        throw std::invalid_argument("cosφ должен быть от 0.1 до 1.0");
    if (efficiency <= 0.0 || efficiency > 1.0)
        throw std::invalid_argument("КПД должен быть от 0.0 до 1.0");

    double current = power / (SQRT3 * voltage * cosPhi * efficiency);
    double apparent = apparentPower(power, cosPhi);
    double reactive = reactivePower(power, cosPhi);

    return {
        power,
        current,
        apparent,
        reactive,
        "ПУЭ п. 1.3.10 — расчёт тока трёхфазной нагрузки"
    };
}

PowerResult PowerCalculator::singlePhasePower(double current, double voltage,
                                              double cosPhi, double efficiency)
{
    if (current <= 0)
        throw std::invalid_argument("Ток должен быть положительным");
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");
    if (cosPhi < 0.1 || cosPhi > 1.0)
        throw std::invalid_argument("cosφ должен быть от 0.1 до 1.0");
    if (efficiency <= 0.0 || efficiency > 1.0)
        throw std::invalid_argument("КПД должен быть от 0.0 до 1.0");

    double power = voltage * current * cosPhi * efficiency;
    double apparent = apparentPower(power, cosPhi);
    double reactive = reactivePower(power, cosPhi);

    return {
        power,
        current,
        apparent,
        reactive,
        "ПУЭ п. 1.3.10 — расчёт мощности однофазной нагрузки"
    };
}

PowerResult PowerCalculator::threePhasePower(double current, double voltage,
                                             double cosPhi, double efficiency)
{
    if (current <= 0)
        throw std::invalid_argument("Ток должен быть положительным");
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");
    if (cosPhi < 0.1 || cosPhi > 1.0)
        throw std::invalid_argument("cosφ должен быть от 0.1 до 1.0");
    if (efficiency <= 0.0 || efficiency > 1.0)
        throw std::invalid_argument("КПД должен быть от 0.0 до 1.0");

    double power = SQRT3 * voltage * current * cosPhi * efficiency;
    double apparent = apparentPower(power, cosPhi);
    double reactive = reactivePower(power, cosPhi);

    return {
        power,
        current,
        apparent,
        reactive,
        "ПУЭ п. 1.3.10 — расчёт мощности трёхфазной нагрузки"
    };
}

double PowerCalculator::apparentPower(double power, double cosPhi)
{
    if (cosPhi <= 0.0 || cosPhi > 1.0)
        throw std::invalid_argument("cosφ должен быть от 0.0 до 1.0");
    return power / cosPhi;
}

double PowerCalculator::reactivePower(double power, double cosPhi)
{
    if (cosPhi <= 0.0 || cosPhi > 1.0)
        throw std::invalid_argument("cosφ должен быть от 0.0 до 1.0");
    double sinPhi = std::sqrt(1.0 - cosPhi * cosPhi);
    return power * sinPhi / cosPhi;
}

} // namespace Core
