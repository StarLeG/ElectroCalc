// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef CORE_UPS_H
#define CORE_UPS_H
#include <QString>
namespace Core {
struct UpsResult {
    double capacity;         ///< Ёмкость АКБ, А·ч
    double generatorPower;   ///< Мощность генератора, кВА
    QString normativeRef;
};
class UpsCalculator {
public:
    static UpsResult calculate(double loadPower, double backupTimeMinutes,
                               double batteryVoltage, double efficiency = 0.9,
                               double dod = 0.8);
};
} // namespace Core
#endif
