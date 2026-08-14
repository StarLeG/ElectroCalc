// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "rtd.h"
#include <cmath>
#include <stdexcept>
namespace Kipia {
// IEC 60751 coefficients
static const double A = 3.9083e-3;
static const double B = -5.775e-7;
static const double C = -4.183e-12; // for t < 0

RtdResult RtdCalculator::tempToResistance(double temperature, double r0)
{
    if (r0 <= 0) throw std::invalid_argument("R0 > 0");
    double R;
    if (temperature >= 0) {
        R = r0 * (1.0 + A * temperature + B * temperature * temperature);
    } else {
        R = r0 * (1.0 + A * temperature + B * temperature * temperature
                  + C * (temperature - 100.0) * temperature * temperature * temperature);
    }
    return { R, temperature, "IEC 60751 — календар-ван Дюзен для Pt" };
}

RtdResult RtdCalculator::resistanceToTemp(double resistance, double r0)
{
    if (r0 <= 0) throw std::invalid_argument("R0 > 0");
    if (resistance <= 0) throw std::invalid_argument("R > 0");

    // Итеративное решение: t ≈ (R/R0 - 1) / A (первая итерация)
    double t = (resistance / r0 - 1.0) / A;
    // Уточнение методом Ньютона
    for (int i = 0; i < 10; ++i) {
        double f = r0 * (1.0 + A * t + B * t * t) - resistance;
        double fp = r0 * (A + 2.0 * B * t);
        if (std::abs(fp) < 1e-15) break;
        t = t - f / fp;
    }
    return { resistance, t, "IEC 60751 — календар-ван Дюзен для Pt" };
}
} // namespace Kipia
