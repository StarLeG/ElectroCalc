// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef KIPIA_CURRENTLOOP_H
#define KIPIA_CURRENTLOOP_H
#include <QString>
namespace Kipia {
struct CurrentLoopResult {
    double maxResistance;    ///< Макс. сопротивление петли, Ом
    double totalResistance;  ///< Суммарное сопротивление, Ом
    double voltageDrop;      ///< Падение напряжения, В
    bool isValid;            ///< Петля валидна
    QString normativeRef;
};
class CurrentLoopCalculator {
public:
    static CurrentLoopResult calculate(double supplyVoltage, double minDeviceVoltage,
                                       double wireResistance, double deviceResistance,
                                       double barrierResistance = 0, double maxCurrent = 0.02);
};
} // namespace Kipia
#endif
