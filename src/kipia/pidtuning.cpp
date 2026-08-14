// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "pidtuning.h"
#include <stdexcept>
namespace Kipia {
PidResult PidTuningCalculator::zieglerNichols(double ku, double tu)
{
    if (ku <= 0) throw std::invalid_argument("Ku > 0");
    if (tu <= 0) throw std::invalid_argument("Tu > 0");

    double kp = 0.6 * ku;
    double ti = 0.5 * tu;
    double td = 0.125 * tu;
    double ki = kp / ti;
    double kd = kp * td;

    return { kp, ti, td, ki, kd,
             "Циглер-Никольс — настройка ПИД по критическим параметрам" };
}

PidResult PidTuningCalculator::reactionCurve(double L, double T, double k)
{
    if (L <= 0) throw std::invalid_argument("L > 0");
    if (T <= 0) throw std::invalid_argument("T > 0");
    if (k <= 0) throw std::invalid_argument("k > 0");

    double kp = T / (k * L);
    double ti = 2.0 * L;
    double td = 0.5 * L;
    double ki = kp / ti;
    double kd = kp * td;

    return { kp, ti, td, ki, kd,
             "Циглер-Никольс — настройка ПИД по кривой разгона" };
}
} // namespace Kipia
