// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UTIL_UNITCONVERTER_H
#define UTIL_UNITCONVERTER_H

#include <QString>
#include <QVector>
#include <QPair>

namespace Util {

/// Конвертер единиц измерения
class UnitConverter
{
public:
    // === Сечение ===
    static double mm2ToAwg(double mm2);
    static double awgToMm2(double awg);
    static QString nearestAwg(double mm2);

    // === Температура ===
    static double celsiusToFahrenheit(double c);
    static double fahrenheitToCelsius(double f);
    static double celsiusToKelvin(double c);
    static double kelvinToCelsius(double k);

    // === Мощность ===
    static double kwToHP(double kw);
    static double hpToKW(double hp);
    static double kvaToKw(double kva, double cosPhi);
    static double kwToKva(double kw, double cosPhi);
    static double kvaToKvar(double kva, double cosPhi);
    static double wattsToDBm(double watts);
    static double dbmToWatts(double dbm);

    // === Давление ===
    static double mpaToBar(double mpa);
    static double barToMpa(double bar);
    static double kpaToPsi(double kpa);
    static double psiToKpa(double psi);
    static double atmToKpa(double atm);

    // === Расход ===
    static double m3hToLmin(double m3h);
    static double lminToM3h(double lmin);
    static double gpmToLmin(double gpm);

    // === Длина ===
    static double mmToInch(double mm);
    static double inchToMm(double inch);
    static double feetToM(double feet);

    // === Справочники ===

    /// Стандартные сечения кабелей, мм²
    static QVector<double> standardSections();

    /// Стандартные номиналы автоматов, А
    static QVector<double> standardBreakerRatings();

    /// Стандартные номиналы УЗО, мА
    static QVector<double> standardRCDRatings();

    /// Удельное сопротивление материалов при 20°C, Ом·мм²/м
    static QVector<QPair<QString, double>> resistivityTable();

    /// Температурные коэффициенты сопротивления
    static QVector<QPair<QString, double>> temperatureCoefficients();

    /// Степени защиты IP
    static QVector<QPair<QString, QString>> ipTable();

    /// Цветовая маркировка проводов
    static QVector<QPair<QString, QString>> wireColorCodes();
};

} // namespace Util

#endif // UTIL_UNITCONVERTER_H
