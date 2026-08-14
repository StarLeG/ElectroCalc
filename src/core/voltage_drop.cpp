// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "voltage_drop.h"
#include <cmath>
#include <stdexcept>

namespace Core {

VoltageDropResult VoltageDropCalculator::singlePhase(double current, double length,
                                                     double resistance, double reactance,
                                                     double cosPhi, double voltage)
{
    if (current <= 0)
        throw std::invalid_argument("Ток должен быть положительным");
    if (length <= 0)
        throw std::invalid_argument("Длина должна быть положительной");
    if (resistance < 0)
        throw std::invalid_argument("Сопротивление не может быть отрицательным");
    if (reactance < 0)
        throw std::invalid_argument("Индуктивное сопротивление не может быть отрицательным");
    if (cosPhi < 0.1 || cosPhi > 1.0)
        throw std::invalid_argument("cosφ должен быть от 0.1 до 1.0");
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");

    double sinPhi = std::sqrt(1.0 - cosPhi * cosPhi);
    double dropVolts = 2.0 * current * length * (resistance * cosPhi + reactance * sinPhi) / 1000.0;
    double dropPercent = (dropVolts / voltage) * 100.0;
    double voltageAtEnd = voltage - dropVolts;

    return {
        dropVolts,
        dropPercent,
        voltageAtEnd,
        "ПУЭ п. 1.3.10 — расчёт потерь напряжения в однофазной линии"
    };
}

VoltageDropResult VoltageDropCalculator::threePhase(double current, double length,
                                                    double resistance, double reactance,
                                                    double cosPhi, double voltage)
{
    if (current <= 0)
        throw std::invalid_argument("Ток должен быть положительным");
    if (length <= 0)
        throw std::invalid_argument("Длина должна быть положительной");
    if (resistance < 0)
        throw std::invalid_argument("Сопротивление не может быть отрицательным");
    if (reactance < 0)
        throw std::invalid_argument("Индуктивное сопротивление не может быть отрицательным");
    if (cosPhi < 0.1 || cosPhi > 1.0)
        throw std::invalid_argument("cosφ должен быть от 0.1 до 1.0");
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");

    double sqrt3 = std::sqrt(3.0);
    double sinPhi = std::sqrt(1.0 - cosPhi * cosPhi);
    double dropVolts = sqrt3 * current * length * (resistance * cosPhi + reactance * sinPhi) / 1000.0;
    double dropPercent = (dropVolts / voltage) * 100.0;
    double voltageAtEnd = voltage - dropVolts;

    return {
        dropVolts,
        dropPercent,
        voltageAtEnd,
        "ПУЭ п. 1.3.10 — расчёт потерь напряжения в трёхфазной линии"
    };
}

VoltageDropResult VoltageDropCalculator::simple(double current, double length,
                                                double resistance, double voltage,
                                                bool threePhase)
{
    if (current <= 0)
        throw std::invalid_argument("Ток должен быть положительным");
    if (length <= 0)
        throw std::invalid_argument("Длина должна быть положительной");
    if (resistance < 0)
        throw std::invalid_argument("Сопротивление не может быть отрицательным");
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");

    double factor = threePhase ? std::sqrt(3.0) : 2.0;
    double dropVolts = factor * current * length * resistance / 1000.0;
    double dropPercent = (dropVolts / voltage) * 100.0;
    double voltageAtEnd = voltage - dropVolts;

    return {
        dropVolts,
        dropPercent,
        voltageAtEnd,
        threePhase ? "ПУЭ п. 1.3.10 — упрощённый расчёт для трёхфазной линии"
                   : "ПУЭ п. 1.3.10 — упрощённый расчёт для однофазной линии"
    };
}

} // namespace Core
