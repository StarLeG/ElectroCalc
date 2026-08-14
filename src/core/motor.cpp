// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "motor.h"
#include <cmath>
#include <stdexcept>
namespace Core {
MotorResult MotorCalculator::calculate(double power, double voltage, double cosPhi,
                                       double efficiency, double startingMultiple, bool threePhase)
{
    if (power <= 0) throw std::invalid_argument("Мощность > 0");
    if (voltage <= 0) throw std::invalid_argument("Напряжение > 0");
    if (cosPhi < 0.1 || cosPhi > 1.0) throw std::invalid_argument("cosφ: 0.1–1.0");
    if (efficiency <= 0 || efficiency > 1.0) throw std::invalid_argument("КПД: 0–1");

    double sqrt3 = std::sqrt(3.0);
    double In = threePhase ? power / (sqrt3 * voltage * cosPhi * efficiency)
                           : power / (voltage * cosPhi * efficiency);
    double Ist = In * startingMultiple;

    // Автомат: D-характеристика, номинал ≥ 1.5 * In
    double breaker = std::ceil(In * 1.5);
    // Округление до стандартного ряда
    static const double ratings[] = {6,10,16,20,25,32,40,50,63,80,100,125};
    for (double r : ratings) { if (r >= breaker) { breaker = r; break; } }

    // Сечение: по нагреву (грубо: In / 4 для Cu)
    double section = std::ceil(In / 4.0);
    static const double sections[] = {1.5,2.5,4,6,10,16,25,35,50,70,95,120};
    for (double s : sections) { if (s >= section) { section = s; break; } }

    return { In, Ist, breaker, section, 0.0,
             "ПУЭ п. 1.3.10, 5.3.71 — выбор оборудования двигателя" };
}
} // namespace Core
