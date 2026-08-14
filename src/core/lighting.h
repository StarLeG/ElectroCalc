// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef CORE_LIGHTING_H
#define CORE_LIGHTING_H
#include <QString>
namespace Core {
struct LightingResult {
    int luminaireCount;      ///< Число светильников
    double installedPower;   ///< Установленная мощность, Вт
    double specificPower;    ///< Удельная мощность, Вт/м²
    QString normativeRef;
};
class LightingCalculator {
public:
    static LightingResult calculate(double area, double requiredLux,
                                    double luminaireFlux, double utilization,
                                    double maintenanceFactor = 0.8);
};
} // namespace Core
#endif
