// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef CORE_MOTOR_H
#define CORE_MOTOR_H
#include <QString>
namespace Core {
struct MotorResult {
    double nominalCurrent;     ///< Номинальный ток, А
    double startingCurrent;    ///< Пусковой ток, А
    double breakerRating;      ///< Номинал автомата, А
    double cableSection;       ///< Сечение кабеля, мм²
    double startingDropPercent;///< Падение при пуске, %
    QString normativeRef;
};
class MotorCalculator {
public:
    static MotorResult calculate(double power, double voltage, double cosPhi,
                                 double efficiency, double startingMultiple = 7.0,
                                 bool threePhase = true);
};
} // namespace Core
#endif
