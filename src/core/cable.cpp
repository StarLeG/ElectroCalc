// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "cable.h"
#include <cmath>
#include <stdexcept>

namespace Core {

CableResult CableCalculator::selectByHeating(double current, const QString& material)
{
    if (current <= 0)
        throw std::invalid_argument("Ток должен быть положительным");
    if (material != "Cu" && material != "Al")
        throw std::invalid_argument("Материал должен быть 'Cu' или 'Al'");

    auto table = cableTable();
    for (const auto& data : table) {
        double maxCurrent = (material == "Cu") ? data.maxCurrentCu : data.maxCurrentAl;
        if (maxCurrent >= current) {
            return {
                data.crossSection,
                data.diameter,
                maxCurrent,
                true,  // meetsHeating
                true,  // meetsDensity (проверяется отдельно)
                true,  // meetsVoltageDrop (проверяется отдельно)
                true,  // meetsCorona (для сетей < 1000 В не критично)
                "ПУЭ табл. 1.3.4 — допустимый длительный ток для проводов и кабелей"
            };
        }
    }

    throw std::runtime_error("Не удалось подобрать сечение — ток слишком велик");
}

CableResult CableCalculator::checkAllCriteria(double current, double crossSection,
                                              double length, double voltage,
                                              double maxDropPercent,
                                              const QString& material)
{
    if (current <= 0)
        throw std::invalid_argument("Ток должен быть положительным");
    if (crossSection <= 0)
        throw std::invalid_argument("Сечение должно быть положительным");
    if (length <= 0)
        throw std::invalid_argument("Длина должна быть положительной");
    if (voltage <= 0)
        throw std::invalid_argument("Напряжение должно быть положительным");
    if (material != "Cu" && material != "Al")
        throw std::invalid_argument("Материал должен быть 'Cu' или 'Al'");

    // 1. Проверка по нагреву
    auto table = cableTable();
    double maxCurrent = 0;
    double resistance = 0;
    for (const auto& data : table) {
        if (std::abs(data.crossSection - crossSection) < 0.01) {
            maxCurrent = (material == "Cu") ? data.maxCurrentCu : data.maxCurrentAl;
            resistance = data.resistance;
            break;
        }
    }
    bool meetsHeating = (current <= maxCurrent);

    // 2. Проверка по экономической плотности тока
    double density = current / crossSection;
    double econDensity = economicDensity(material);
    bool meetsDensity = (density <= econDensity);

    // 3. Проверка по потерям напряжения
    double dropVolts = current * resistance * length / 1000.0;
    double dropPercent = (dropVolts / voltage) * 100.0;
    bool meetsVoltageDrop = (dropPercent <= maxDropPercent);

    // 4. Коронный разряд (для сетей до 1000 В не критично)
    bool meetsCorona = true;

    return {
        crossSection,
        diameterFromSection(crossSection),
        maxCurrent,
        meetsHeating,
        meetsDensity,
        meetsVoltageDrop,
        meetsCorona,
        "ПУЭ табл. 1.3.4, 1.3.5 — проверка сечения кабеля"
    };
}

double CableCalculator::diameterFromSection(double crossSection)
{
    if (crossSection <= 0)
        throw std::invalid_argument("Сечение должно быть положительным");
    return 2.0 * std::sqrt(crossSection / M_PI);
}

QVector<CableData> CableCalculator::cableTable()
{
    // Типовые сечения из ПУЭ (медные жилы, до 1000 В)
    return {
        {  1.5,  1.38,  19,  15, 12.07, 0.08 },
        {  2.5,  1.78,  27,  21,  7.24, 0.08 },
        {  4.0,  2.26,  38,  29,  4.53, 0.07 },
        {  6.0,  2.76,  46,  38,  3.02, 0.07 },
        { 10.0,  3.57,  70,  55,  1.81, 0.07 },
        { 16.0,  4.51,  95,  75,  1.13, 0.06 },
        { 25.0,  5.64, 130, 100,  0.72, 0.06 },
        { 35.0,  6.68, 160, 125,  0.52, 0.06 },
        { 50.0,  7.98, 200, 160,  0.36, 0.06 },
        { 70.0,  9.44, 255, 200,  0.26, 0.06 },
        { 95.0, 11.00, 310, 245,  0.19, 0.06 },
        {120.0, 12.36, 360, 280,  0.15, 0.06 },
        {150.0, 13.82, 410, 320,  0.12, 0.06 },
        {185.0, 15.35, 470, 370,  0.10, 0.06 },
        {240.0, 17.48, 555, 430,  0.08, 0.06 }
    };
}

double CableCalculator::economicDensity(const QString& material)
{
    // Экономическая плотность тока, А/мм² (ПУЭ п. 1.3.5)
    return (material == "Cu") ? 2.5 : 1.9;
}

} // namespace Core
