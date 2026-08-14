// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "energy.h"
#include <stdexcept>

namespace Core {

EnergyResult EnergyCalculator::energyKWh(double power, double timeHours)
{
    if (power < 0)
        throw std::invalid_argument("Мощность не может быть отрицательной");
    if (timeHours < 0)
        throw std::invalid_argument("Время не может быть отрицательным");

    double energy = power * timeHours;
    double joules = energy * 3600000.0; // 1 кВт·ч = 3.6·10⁶ Дж

    return {
        energy,
        joules,
        0.0,
        "Формула E = P·t"
    };
}

EnergyResult EnergyCalculator::energyJoules(double voltage, double current, double timeSeconds)
{
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");
    if (current <= 0)
        throw std::invalid_argument("Ток должен быть положительным");
    if (timeSeconds < 0)
        throw std::invalid_argument("Время не может быть отрицательным");

    double joules = voltage * current * timeSeconds;
    double kWh = joules / 3600000.0;

    return {
        kWh,
        joules,
        0.0,
        "Формула A = U·I·t"
    };
}

double EnergyCalculator::cost(double energyKWh, double tariff, int days)
{
    if (energyKWh < 0)
        throw std::invalid_argument("Энергия не может быть отрицательной");
    if (tariff < 0)
        throw std::invalid_argument("Тариф не может быть отрицательным");
    if (days < 0)
        throw std::invalid_argument("Количество дней не может быть отрицательным");

    return energyKWh * tariff * days;
}

double EnergyCalculator::averagePower(double energyKWh, double hours)
{
    if (energyKWh < 0)
        throw std::invalid_argument("Энергия не может быть отрицательной");
    if (hours <= 0)
        throw std::invalid_argument("Время должно быть положительным");

    return energyKWh / hours;
}

} // namespace Core
