// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef KIPIA_SIGNALSCALING_H
#define KIPIA_SIGNALSCALING_H
#include <QString>
namespace Kipia {
struct ScalingResult {
    double processValue;     ///< Значение процесса
    double signalPercent;    ///< Сигнал, %
    double signalMA;         ///< Сигнал, мА
    QString normativeRef;
};
class SignalScalingCalculator {
public:
    /// Сигнал → PV: PV = LRV + (S-Smin)/(Smax-Smin) * (URV-LRV)
    static ScalingResult signalToPV(double signal, double signalMin, double signalMax,
                                     double lrv, double urv, bool squareRoot = false);
    /// PV → сигнал
    static ScalingResult pvToSignal(double pv, double signalMin, double signalMax,
                                     double lrv, double urv, bool squareRoot = false);
};
} // namespace Kipia
#endif
