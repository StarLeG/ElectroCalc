// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "compensation.h"
#include <cmath>
#include <stdexcept>

namespace Core {

CompensationResult CompensationCalculator::compensate(double activePower, double cosPhiBefore,
                                                       double cosPhiAfter, double stepSize)
{
    if (activePower <= 0) throw std::invalid_argument("Мощность > 0");
    if (cosPhiBefore < 0.1 || cosPhiBefore > 1.0) throw std::invalid_argument("cosφ до: 0.1–1.0");
    if (cosPhiAfter < cosPhiBefore || cosPhiAfter > 1.0) throw std::invalid_argument("cosφ после ≥ до");
    if (stepSize <= 0) throw std::invalid_argument("Размер ступени > 0");

    double tg1 = std::sqrt(1.0 - cosPhiBefore * cosPhiBefore) / cosPhiBefore;
    double tg2 = std::sqrt(1.0 - cosPhiAfter * cosPhiAfter) / cosPhiAfter;
    double Qc = activePower * (tg1 - tg2);
    int steps = static_cast<int>(std::ceil(Qc / stepSize));
    double reactiveBefore = activePower * tg1;
    double reactiveAfter = activePower * tg2;
    double savings = (reactiveBefore > 0) ? ((reactiveBefore - reactiveAfter) / reactiveBefore * 100.0) : 0;

    return { Qc, steps, reactiveBefore, reactiveAfter, savings,
             "ПУЭ п. 1.5.15 — компенсация реактивной мощности" };
}

double CompensationCalculator::motorCompensation(double nominalPower, double cosPhiNominal,
                                                  double cosPhiTarget)
{
    if (nominalPower <= 0) throw std::invalid_argument("Мощность > 0");
    double tg1 = std::sqrt(1.0 - cosPhiNominal * cosPhiNominal) / cosPhiNominal;
    double tg2 = std::sqrt(1.0 - cosPhiTarget * cosPhiTarget) / cosPhiTarget;
    return nominalPower * (tg1 - tg2);
}

} // namespace Core
