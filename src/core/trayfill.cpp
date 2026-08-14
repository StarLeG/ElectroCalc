// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#include "trayfill.h"
#include <cmath>
#include <stdexcept>
namespace Core {
TrayFillResult TrayFillCalculator::calculate(const QVector<double>& cableSections,
                                              double trayWidth, double trayHeight)
{
    if (cableSections.isEmpty()) throw std::invalid_argument("Нет кабелей");
    if (trayWidth <= 0 || trayHeight <= 0) throw std::invalid_argument("Размеры лотка > 0");

    // Суммарная площадь кабелей (круглое сечение)
    double totalArea = 0;
    for (double s : cableSections) {
        if (s <= 0) throw std::invalid_argument("Сечение > 0");
        totalArea += s;
    }

    double trayArea = trayWidth * trayHeight;
    double fillPercent = (totalArea / trayArea) * 100.0;

    // Минимальная ширина лотка: площадь кабелей / (высота * коэфф. заполнения 0.5)
    double minWidth = totalArea / (trayHeight * 0.5);

    // Минимальный диаметр трубы
    double minPipe = minPipeDiameter(cableSections);

    return { totalArea, trayArea, fillPercent, minWidth, minPipe,
             "ПУЭ п. 2.1.85 — заполнение лотков и труб" };
}

double TrayFillCalculator::minPipeDiameter(const QVector<double>& cableSections)
{
    double totalArea = 0;
    for (double s : cableSections) totalArea += s;

    // Площадь трубы ≥ сумма площадей кабелей / 0.4 (40% заполнение)
    double pipeArea = totalArea / 0.4;
    // d = 2 * sqrt(S / π)
    double diameter = 2.0 * std::sqrt(pipeArea / M_PI);

    // Округление до стандартных диаметров (мм)
    static const double diameters[] = {16,20,25,32,40,50,63,80,100,125,150,200};
    for (double d : diameters) { if (d >= diameter) return d; }
    return diameter;
}
} // namespace Core
