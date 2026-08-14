// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "currentloop.h"
#include <stdexcept>
namespace Kipia {
CurrentLoopResult CurrentLoopCalculator::calculate(double supplyVoltage, double minDeviceVoltage,
                                                    double wireResistance, double deviceResistance,
                                                    double barrierResistance, double maxCurrent)
{
    if (supplyVoltage <= 0) throw std::invalid_argument("Напряжение питания > 0");
    if (minDeviceVoltage < 0) throw std::invalid_argument("Мин. напряжение ≥ 0");
    if (wireResistance < 0) throw std::invalid_argument("R проводов ≥ 0");
    if (deviceResistance < 0) throw std::invalid_argument("R прибора ≥ 0");
    if (barrierResistance < 0) throw std::invalid_argument("R барьера ≥ 0");

    double Rmax = (supplyVoltage - minDeviceVoltage) / maxCurrent;
    double Rtotal = deviceResistance + wireResistance + barrierResistance;
    double Vdrop = maxCurrent * Rtotal;
    bool valid = (Rtotal <= Rmax);

    return { Rmax, Rtotal, Vdrop, valid,
             "IEC 60751 — расчёт токовой петли 4–20 мА" };
}
} // namespace Kipia
