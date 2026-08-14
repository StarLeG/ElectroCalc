// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "transformer.h"
#include <cmath>
#include <stdexcept>
namespace Core {
TransformerResult TransformerCalculator::calculate(double loadPower, double cosPhi,
                                                    double voltageHN, double voltageLN,
                                                    double shortCircuitVoltagePercent)
{
    if (loadPower <= 0) throw std::invalid_argument("Мощность > 0");
    if (cosPhi <= 0 || cosPhi > 1.0) throw std::invalid_argument("cosφ: 0–1");
    if (voltageHN <= 0 || voltageLN <= 0) throw std::invalid_argument("Напряжение > 0");
    if (shortCircuitVoltagePercent <= 0) throw std::invalid_argument("uк% > 0");

    double S = loadPower / cosPhi; // кВА
    double sqrt3 = std::sqrt(3.0);
    double I_HN = S / (sqrt3 * voltageHN); // кА → А (* 1000 если S в кВА)
    double I_LN = S / (sqrt3 * voltageLN);
    double I_kz = I_LN * 100.0 / shortCircuitVoltagePercent;

    return { S, I_HN * 1000, I_LN * 1000, I_kz * 1000, loadPower / S,
             "ПУЭ п. 1.4.1 — выбор трансформатора" };
}

double TransformerCalculator::selectStandardPower(double calculatedPower)
{
    static const double powers[] = {25,40,63,100,160,250,400,630,1000,1600,2500,4000,6300};
    for (double p : powers) { if (p >= calculatedPower) return p; }
    return calculatedPower;
}
} // namespace Core
