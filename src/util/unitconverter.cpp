// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "unitconverter.h"
#include <cmath>

namespace Util {

// === Сечение ===

double UnitConverter::mm2ToAwg(double mm2)
{
    // Формула: AWG = -39 * log92(d/0.005) + 36, d = 2*sqrt(S/π)
    double d = 2.0 * std::sqrt(mm2 / M_PI); // диаметр в мм
    double awg = -39.0 * std::log(d / 0.127) / std::log(92.0) + 36.0;
    return std::round(awg);
}

double UnitConverter::awgToMm2(double awg)
{
    // d = 0.127 * 92^((36-AWG)/39), S = π*(d/2)²
    double d = 0.127 * std::pow(92.0, (36.0 - awg) / 39.0);
    return M_PI * d * d / 4.0;
}

QString UnitConverter::nearestAwg(double mm2)
{
    double awg = mm2ToAwg(mm2);
    double actual = awgToMm2(awg);
    return QString("%1 AWG (%2 мм²)").arg(static_cast<int>(awg)).arg(actual, 0, 'f', 2);
}

// === Температура ===

double UnitConverter::celsiusToFahrenheit(double c) { return c * 9.0 / 5.0 + 32.0; }
double UnitConverter::fahrenheitToCelsius(double f) { return (f - 32.0) * 5.0 / 9.0; }
double UnitConverter::celsiusToKelvin(double c) { return c + 273.15; }
double UnitConverter::kelvinToCelsius(double k) { return k - 273.15; }

// === Мощность ===

double UnitConverter::kwToHP(double kw) { return kw / 0.7457; }
double UnitConverter::hpToKW(double hp) { return hp * 0.7457; }

double UnitConverter::kvaToKw(double kva, double cosPhi)
{
    if (cosPhi <= 0 || cosPhi > 1.0) return 0;
    return kva * cosPhi;
}

double UnitConverter::kwToKva(double kw, double cosPhi)
{
    if (cosPhi <= 0 || cosPhi > 1.0) return 0;
    return kw / cosPhi;
}

double UnitConverter::kvaToKvar(double kva, double cosPhi)
{
    if (cosPhi <= 0 || cosPhi > 1.0) return 0;
    double sinPhi = std::sqrt(1.0 - cosPhi * cosPhi);
    return kva * sinPhi;
}

double UnitConverter::wattsToDBm(double watts)
{
    if (watts <= 0) return 0;
    return 10.0 * std::log10(watts / 0.001);
}

double UnitConverter::dbmToWatts(double dbm)
{
    return 0.001 * std::pow(10.0, dbm / 10.0);
}

// === Давление ===

double UnitConverter::mpaToBar(double mpa) { return mpa * 10.0; }
double UnitConverter::barToMpa(double bar) { return bar / 10.0; }
double UnitConverter::kpaToPsi(double kpa) { return kpa * 0.14504; }
double UnitConverter::psiToKpa(double psi) { return psi / 0.14504; }
double UnitConverter::atmToKpa(double atm) { return atm * 101.325; }

// === Расход ===

double UnitConverter::m3hToLmin(double m3h) { return m3h * 1000.0 / 60.0; }
double UnitConverter::lminToM3h(double lmin) { return lmin * 60.0 / 1000.0; }
double UnitConverter::gpmToLmin(double gpm) { return gpm * 3.78541; }

// === Длина ===

double UnitConverter::mmToInch(double mm) { return mm / 25.4; }
double UnitConverter::inchToMm(double inch) { return inch * 25.4; }
double UnitConverter::feetToM(double feet) { return feet * 0.3048; }

// === Справочники ===

QVector<double> UnitConverter::standardSections()
{
    return { 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240 };
}

QVector<double> UnitConverter::standardBreakerRatings()
{
    return { 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125 };
}

QVector<double> UnitConverter::standardRCDRatings()
{
    return { 10, 30, 100, 300 };
}

QVector<QPair<QString, double>> UnitConverter::resistivityTable()
{
    return {
        { "Медь (Cu)",         0.0175 },
        { "Алюминий (Al)",     0.028  },
        { "Сталь",             0.13   },
        { "Нержавеющая сталь", 0.72   }
    };
}

QVector<QPair<QString, double>> UnitConverter::temperatureCoefficients()
{
    return {
        { "Медь (Cu)",         0.00393 },
        { "Алюминий (Al)",     0.00403 },
        { "Сталь",             0.006   },
        { "Нержавеющая сталь", 0.00094 }
    };
}

QVector<QPair<QString, QString>> UnitConverter::ipTable()
{
    return {
        { "IP20",   "Защита от пальцев, нет защиты от влаги" },
        { "IP21",   "Защита от пальцев, капли сверху" },
        { "IP23",   "Защита от пальцев, брызги под углом" },
        { "IP44",   "Защита от предметов >1мм, брызги со всех сторон" },
        { "IP54",   "Защита от пыли (частичная), брызги" },
        { "IP55",   "Защита от пыли (частичная), струи воды" },
        { "IP65",   "Полная защита от пыли, струи воды" },
        { "IP66",   "Полная защита от пыли, мощные струи" },
        { "IP67",   "Полная защита от пыли, кратковременное погружение" },
        { "IP68",   "Полная защита от пыли, длительное погружение" }
    };
}

QVector<QPair<QString, QString>> UnitConverter::wireColorCodes()
{
    return {
        { "L (фаза A)",                "Коричневый" },
        { "L2 (фаза B)",               "Чёрный" },
        { "L3 (фаза C)",               "Серый" },
        { "N (нейтраль)",              "Синий" },
        { "PE (заземление)",           "Жёлто-зелёный" },
        { "PEN (заземл. нейтраль)",    "Синий + жёлто-зелёный на концах" },
        { "DC +",                      "Коричневый" },
        { "DC −",                      "Синий" }
    };
}

} // namespace Util
