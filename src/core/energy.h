// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef CORE_ENERGY_H
#define CORE_ENERGY_H

#include <QString>

namespace Core {

/// Результат расчёта энергии
struct EnergyResult {
    double energyKWh;      ///< Энергия, кВт·ч
    double energyJoules;   ///< Энергия, Дж
    double cost;           ///< Стоимость, руб.
    QString normativeRef;  ///< Нормативная ссылка
};

/// Калькулятор энергии и стоимости
class EnergyCalculator
{
public:
    /// Энергия: E = P * t (кВт·ч)
    /// @param power Мощность, кВт
    /// @param timeHours Время, ч
    static EnergyResult energyKWh(double power, double timeHours);

    /// Энергия в Джоулях: A = U * I * t
    /// @param voltage Напряжение, В
    /// @param current Ток, А
    /// @param timeSeconds Время, с
    static EnergyResult energyJoules(double voltage, double current, double timeSeconds);

    /// Стоимость электроэнергии
    /// @param energyKWh Энергия, кВт·ч
    /// @param tariff Тариф, руб./кВт·ч
    /// @param days Количество дней
    static double cost(double energyKWh, double tariff, int days);

    /// Среднесуточная мощность: P = E / t
    static double averagePower(double energyKWh, double hours);
};

} // namespace Core

#endif // CORE_ENERGY_H
