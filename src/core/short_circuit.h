// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef CORE_SHORT_CIRCUIT_H
#define CORE_SHORT_CIRCUIT_H

#include <QString>

namespace Core {

/// Результат расчёта тока КЗ
struct ShortCircuitResult {
    double current;        ///< Ток КЗ, А
    double impedance;      ///< Полное сопротивление, Ом
    QString normativeRef;  ///< Нормативная ссылка
};

/// Калькулятор токов короткого замыкания (до 1000 В)
class ShortCircuitCalculator
{
public:
    /// Ток КЗ: Iкз = U / (√3 * Z)
    /// @param voltage Линейное напряжение, В
    /// @param impedance Полное сопротивление цепи, Ом
    static ShortCircuitResult calculate(double voltage, double impedance);

    /// Ток КЗ с учётом трансформатора: Iкз = Iном * 100 / uк%
    /// @param nominalCurrent Номинальный ток трансформатора, А
    /// @param shortCircuitVoltage Напряжение КЗ трансформатора, %
    static ShortCircuitResult fromTransformer(double nominalCurrent,
                                              double shortCircuitVoltage);

    /// Метод приведённых длин
    /// @param voltage Напряжение, В
    /// @param transformerImpedance Сопротивление трансформатора, Ом
    /// @param lineLength Длина линии, м
    /// @param lineImpedancePerKm Удельное сопротивление линии, Ом/км
    static ShortCircuitResult equivalentLength(double voltage,
                                               double transformerImpedance,
                                               double lineLength,
                                               double lineImpedancePerKm);
};

} // namespace Core

#endif // CORE_SHORT_CIRCUIT_H
