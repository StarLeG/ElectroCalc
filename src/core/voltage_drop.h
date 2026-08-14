// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef CORE_VOLTAGE_DROP_H
#define CORE_VOLTAGE_DROP_H

#include <QString>

namespace Core {

/// Результат расчёта потерь напряжения
struct VoltageDropResult {
    double dropVolts;      ///< Падение, В
    double dropPercent;    ///< Падение, %
    double voltageAtEnd;   ///< Напряжение в конце линии, В
    QString normativeRef;  ///< Нормативная ссылка
};

/// Калькулятор потерь напряжения
class VoltageDropCalculator
{
public:
    /// Однофазный расчёт: ΔU = 2 * I * L * (R·cosφ + X·sinφ) / 1000
    /// @param current Ток, А
    /// @param length Длина линии, м
    /// @param resistance Активное сопротивление, Ом/км
    /// @param reactance Индуктивное сопротивление, Ом/км
    /// @param cosPhi Коэффициент мощности
    /// @param voltage Напряжение, В
    static VoltageDropResult singlePhase(double current, double length,
                                         double resistance, double reactance,
                                         double cosPhi, double voltage);

    /// Трёхфазный расчёт: ΔU = √3 * I * L * (R·cosφ + X·sinφ) / 1000
    static VoltageDropResult threePhase(double current, double length,
                                        double resistance, double reactance,
                                        double cosPhi, double voltage);

    /// Упрощённый расчёт (без индуктивного сопротивления)
    static VoltageDropResult simple(double current, double length,
                                    double resistance, double voltage,
                                    bool threePhase = false);
};

} // namespace Core

#endif // CORE_VOLTAGE_DROP_H
