// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "short_circuit.h"
#include <cmath>
#include <stdexcept>

namespace Core {

ShortCircuitResult ShortCircuitCalculator::calculate(double voltage, double impedance)
{
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");
    if (impedance <= 0)
        throw std::invalid_argument("Сопротивление должно быть положительным");

    double sqrt3 = std::sqrt(3.0);
    double current = voltage / (sqrt3 * impedance);

    return {
        current,
        impedance,
        "ПУЭ п. 1.4.1 — расчёт тока КЗ"
    };
}

ShortCircuitResult ShortCircuitCalculator::fromTransformer(double nominalCurrent,
                                                           double shortCircuitVoltage)
{
    if (nominalCurrent <= 0)
        throw std::invalid_argument("Номинальный ток должен быть положительным");
    if (shortCircuitVoltage <= 0 || shortCircuitVoltage > 100)
        throw std::invalid_argument("Напряжение КЗ должно быть от 0 до 100%");

    double current = nominalCurrent * 100.0 / shortCircuitVoltage;
    double impedance = 0; // Вычисляется из uк% и Iном

    return {
        current,
        impedance,
        "ПУЭ п. 1.4.1 — ток КЗ от трансформатора, Iкз = Iном * 100 / uк%"
    };
}

ShortCircuitResult ShortCircuitCalculator::equivalentLength(double voltage,
                                                            double transformerImpedance,
                                                            double lineLength,
                                                            double lineImpedancePerKm)
{
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");
    if (transformerImpedance < 0)
        throw std::invalid_argument("Сопротивление трансформатора не может быть отрицательным");
    if (lineLength <= 0)
        throw std::invalid_argument("Длина должна быть положительной");
    if (lineImpedancePerKm < 0)
        throw std::invalid_argument("Удельное сопротивление не может быть отрицательным");

    double lineImpedance = lineImpedancePerKm * lineLength / 1000.0;
    double totalImpedance = transformerImpedance + lineImpedance;

    if (totalImpedance <= 0)
        throw std::invalid_argument("Суммарное сопротивление должно быть положительным");

    double sqrt3 = std::sqrt(3.0);
    double current = voltage / (sqrt3 * totalImpedance);

    return {
        current,
        totalImpedance,
        "ПУЭ п. 1.4.1 — метод приведённых длин"
    };
}

} // namespace Core
