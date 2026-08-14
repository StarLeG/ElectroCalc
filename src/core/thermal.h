// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef CORE_THERMAL_H
#define CORE_THERMAL_H

#include <QString>

namespace Core {

/// Результат теплового расчёта
struct ThermalResult {
    double heat;          ///< Теплота, Дж
    double temperature;   ///< Температура, °C
    double meltingCurrent; ///< Ток плавки, А
    QString normativeRef; ///< Нормативная ссылка
};

/// Калькулятор тепловых расчётов
class ThermalCalculator
{
public:
    /// Количество теплоты: Q = I² * R * t
    /// @param current Ток, А
    /// @param resistance Сопротивление, Ом
    /// @param time Время, с
    static ThermalResult heatGeneration(double current, double resistance, double time);

    /// Изменение температуры: ΔT = Q / (m * c)
    /// @param heat Количество теплоты, Дж
    /// @param mass Масса, кг
    /// @param specificHeat Удельная теплоёмкость, Дж/(кг·°C)
    static double temperatureChange(double heat, double mass, double specificHeat);

    /// Ток плавки проводника
    /// @param crossSection Сечение, мм²
    /// @param material Материал ("Cu", "Al", "Steel")
    /// @param time Время, с
    static double meltingCurrent(double crossSection, const QString& material, double time);

    /// Удельное сопротивление материала при 20°C, Ом·мм²/м
    static double resistivity(const QString& material);
};

} // namespace Core

#endif // CORE_THERMAL_H
