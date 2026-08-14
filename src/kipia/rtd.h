// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef KIPIA_RTD_H
#define KIPIA_RTD_H
#include <QString>
namespace Kipia {
struct RtdResult {
    double resistance;       ///< Сопротивление, Ом
    double temperature;      ///< Температура, °C
    QString normativeRef;
};
class RtdCalculator {
public:
    /// Температура → сопротивление (IEC 60751, t≥0)
    /// R = R0 * (1 + A*t + B*t²)
    static RtdResult tempToResistance(double temperature, double r0 = 100.0);
    /// Сопротивление → температура (обратный пересчёт)
    static RtdResult resistanceToTemp(double resistance, double r0 = 100.0);
};
} // namespace Kipia
#endif
