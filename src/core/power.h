// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef CORE_POWER_H
#define CORE_POWER_H

#include <QString>

namespace Core {

/// Результат расчёта мощности и тока
struct PowerResult {
    double power;          ///< Мощность, Вт
    double current;        ///< Ток, А
    double apparentPower;  ///< Полная мощность, ВА
    double reactivePower;  ///< Реактивная мощность, вар
    QString normativeRef;  ///< Нормативная ссылка
};

/// Калькулятор мощности и тока
class PowerCalculator
{
public:
    /// Однофазный расчёт тока: I = P / (U * cosφ * η)
    /// @param power Мощность, Вт
    /// @param voltage Напряжение, В (220, 380, 660 или произвольное)
    /// @param cosPhi Коэффициент мощности (0.1–1.0)
    /// @param efficiency КПД (0.0–1.0, по умолчанию 1.0)
    /// @return Результат с током и нормативной ссылкой
    static PowerResult singlePhaseCurrent(double power, double voltage,
                                          double cosPhi, double efficiency = 1.0);

    /// Трёхфазный расчёт тока: I = P / (√3 * U * cosφ * η)
    static PowerResult threePhaseCurrent(double power, double voltage,
                                         double cosPhi, double efficiency = 1.0);

    /// Расчёт мощности по току (однофазный): P = U * I * cosφ * η
    static PowerResult singlePhasePower(double current, double voltage,
                                        double cosPhi, double efficiency = 1.0);

    /// Расчёт мощности по току (трёхфазный): P = √3 * U * I * cosφ * η
    static PowerResult threePhasePower(double current, double voltage,
                                       double cosPhi, double efficiency = 1.0);

    /// Полная мощность: S = P / cosφ
    static double apparentPower(double power, double cosPhi);

    /// Реактивная мощность: Q = P * tg(φ)
    static double reactivePower(double power, double cosPhi);

private:
    static const double SQRT3;
};

} // namespace Core

#endif // CORE_POWER_H
