// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "thermal.h"
#include <cmath>
#include <stdexcept>

namespace Core {

ThermalResult ThermalCalculator::heatGeneration(double current, double resistance, double time)
{
    if (current <= 0)
        throw std::invalid_argument("Ток должен быть положительным");
    if (resistance < 0)
        throw std::invalid_argument("Сопротивление не может быть отрицательным");
    if (time <= 0)
        throw std::invalid_argument("Время должно быть положительным");

    double heat = current * current * resistance * time;

    return {
        heat,
        0.0, // Температура вычисляется отдельно
        0.0, // Ток плавки вычисляется отдельно
        "ПУЭ п. 1.3.10 — тепловой расчёт Q = I²·R·t"
    };
}

double ThermalCalculator::temperatureChange(double heat, double mass, double specificHeat)
{
    if (heat <= 0)
        throw std::invalid_argument("Количество теплоты должно быть положительным");
    if (mass <= 0)
        throw std::invalid_argument("Масса должна быть положительной");
    if (specificHeat <= 0)
        throw std::invalid_argument("Удельная теплоёмкость должна быть положительной");

    return heat / (mass * specificHeat);
}

double ThermalCalculator::meltingCurrent(double crossSection, const QString& material, double time)
{
    if (crossSection <= 0)
        throw std::invalid_argument("Сечение должно быть положительным");
    if (time <= 0)
        throw std::invalid_argument("Время должно быть положительным");
    if (material != "Cu" && material != "Al" && material != "Steel")
        throw std::invalid_argument("Материал должен быть 'Cu', 'Al' или 'Steel'");

    // Упрощённая формула: I = K * √S / √t
    // K — коэффициент, зависящий от материала
    double k = 0.0;
    if (material == "Cu") k = 150.0;
    else if (material == "Al") k = 100.0;
    else if (material == "Steel") k = 70.0;

    return k * std::sqrt(crossSection) / std::sqrt(time);
}

double ThermalCalculator::resistivity(const QString& material)
{
    if (material == "Cu") return 0.0175;   // Ом·мм²/м
    if (material == "Al") return 0.028;    // Ом·мм²/м
    if (material == "Steel") return 0.13;  // Ом·мм²/м
    throw std::invalid_argument("Материал должен быть 'Cu', 'Al' или 'Steel'");
}

} // namespace Core
