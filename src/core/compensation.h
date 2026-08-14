// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef CORE_COMPENSATION_H
#define CORE_COMPENSATION_H

#include <QString>

namespace Core {

struct CompensationResult {
    double reactivePower;      ///< Реактивная мощность компенсации, квар
    int steps;                 ///< Число ступеней
    double reactiveBefore;     ///< Реактивная мощность до компенсации, квар
    double reactiveAfter;      ///< Реактивная мощность после компенсации, квар
    double savingsPercent;     ///< Экономия, %
    QString normativeRef;
};

/// Калькулятор компенсации реактивной мощности
class CompensationCalculator
{
public:
    /// Компенсация: Qc = P * (tgφ1 - tgφ2)
    static CompensationResult compensate(double activePower, double cosPhiBefore,
                                         double cosPhiAfter, double stepSize = 10.0);

    /// Мощность компенсации для двигателя
    static double motorCompensation(double nominalPower, double cosPhiNominal,
                                    double cosPhiTarget);
};

} // namespace Core
#endif
