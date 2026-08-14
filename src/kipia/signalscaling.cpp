// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "signalscaling.h"
#include <cmath>
#include <stdexcept>
namespace Kipia {
ScalingResult SignalScalingCalculator::signalToPV(double signal, double signalMin, double signalMax,
                                                   double lrv, double urv, bool squareRoot)
{
    if (signalMax <= signalMin) throw std::invalid_argument("Smax > Smin");
    if (urv <= lrv) throw std::invalid_argument("URV > LRV");

    double ratio = (signal - signalMin) / (signalMax - signalMin);
    if (squareRoot) ratio = std::sqrt(ratio);
    double pv = lrv + ratio * (urv - lrv);
    double percent = ratio * 100.0;

    return { pv, percent, signal, "IEC 61131-3 — масштабирование аналоговых сигналов" };
}

ScalingResult SignalScalingCalculator::pvToSignal(double pv, double signalMin, double signalMax,
                                                   double lrv, double urv, bool squareRoot)
{
    if (signalMax <= signalMin) throw std::invalid_argument("Smax > Smin");
    if (urv <= lrv) throw std::invalid_argument("URV > LRV");

    double ratio = (pv - lrv) / (urv - lrv);
    if (squareRoot) ratio = ratio * ratio;
    double signal = signalMin + ratio * (signalMax - signalMin);
    double percent = ratio * 100.0;

    return { pv, percent, signal, "IEC 61131-3 — масштабирование аналоговых сигналов" };
}
} // namespace Kipia
