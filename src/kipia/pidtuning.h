// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef KIPIA_PIDTUNING_H
#define KIPIA_PIDTUNING_H
#include <QString>
namespace Kipia {
struct PidResult {
    double kp;               ///< Пропорциональный коэффициент
    double ti;               ///< Время интегрирования, с
    double td;               ///< Время дифференцирования, с
    double ki;               ///< Ki = Kp / Ti
    double kd;               ///< Kd = Kp * Td
    QString normativeRef;
};
class PidTuningCalculator {
public:
    /// Циглер-Никольс по критическим параметрам
    static PidResult zieglerNichols(double ku, double tu);
    /// Циглер-Никольс по кривой разгона (L, T)
    static PidResult reactionCurve(double L, double T, double k);
};
} // namespace Kipia
#endif
