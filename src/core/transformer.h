// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef CORE_TRANSFORMER_H
#define CORE_TRANSFORMER_H
#include <QString>
namespace Core {
struct TransformerResult {
    double power;              ///< Мощность, кВА
    double currentHN;          ///< Ток ВН, А
    double currentLN;          ///< Ток НН, А
    double shortCircuitCurrent;///< Ток КЗ, А
    double loadFactor;         ///< Коэффициент загрузки
    QString normativeRef;
};
class TransformerCalculator {
public:
    static TransformerResult calculate(double loadPower, double cosPhi,
                                       double voltageHN, double voltageLN,
                                       double shortCircuitVoltagePercent);
    static double selectStandardPower(double calculatedPower);
};
} // namespace Core
#endif
