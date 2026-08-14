// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "ups.h"
#include <cmath>
#include <stdexcept>
namespace Core {
UpsResult UpsCalculator::calculate(double loadPower, double backupTimeMinutes,
                                    double batteryVoltage, double efficiency, double dod)
{
    if (loadPower <= 0) throw std::invalid_argument("Мощность > 0");
    if (backupTimeMinutes <= 0) throw std::invalid_argument("Время > 0");
    if (batteryVoltage <= 0) throw std::invalid_argument("Напряжение > 0");
    if (efficiency <= 0 || efficiency > 1.0) throw std::invalid_argument("КПД: 0–1");
    if (dod <= 0 || dod > 1.0) throw std::invalid_argument("DoD: 0–1");

    // Ah = (P * t_hours) / (U * η * DoD)
    double hours = backupTimeMinutes / 60.0;
    double capacity = (loadPower * 1000.0 * hours) / (batteryVoltage * efficiency * dod);

    // Генератор: S = P / cosφ с запасом 25%
    double generatorPower = loadPower / 0.8 * 1.25;

    return { capacity, generatorPower,
             "Выбор ИБП и АКБ по времени резервирования" };
}
} // namespace Core
