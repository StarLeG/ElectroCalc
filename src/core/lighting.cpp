// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "lighting.h"
#include <cmath>
#include <stdexcept>
namespace Core {
LightingResult LightingCalculator::calculate(double area, double requiredLux,
                                              double luminaireFlux, double utilization,
                                              double maintenanceFactor)
{
    if (area <= 0) throw std::invalid_argument("Площадь > 0");
    if (requiredLux <= 0) throw std::invalid_argument("Освещённость > 0");
    if (luminaireFlux <= 0) throw std::invalid_argument("Световой поток > 0");
    if (utilization <= 0 || utilization > 1.0) throw std::invalid_argument("КИП: 0–1");
    if (maintenanceFactor <= 0 || maintenanceFactor > 1.0) throw std::invalid_argument("Кз: 0–1");

    // N = (E * S * Kз) / (Φ * η)
    double N = (requiredLux * area * maintenanceFactor) / (luminaireFlux * utilization);
    int count = static_cast<int>(std::ceil(N));

    // Assume 36W per luminaire (typical LED panel)
    double powerPerLuminaire = 36.0;
    double installedPower = count * powerPerLuminaire;
    double specificPower = installedPower / area;

    return { count, installedPower, specificPower,
             "СП 52.13330.2016 — расчёт искусственного освещения" };
}
} // namespace Core
