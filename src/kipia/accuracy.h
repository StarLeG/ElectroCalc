// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef KIPIA_ACCURACY_H
#define KIPIA_ACCURACY_H
#include <QString>
#include <QVector>
namespace Kipia {
struct AccuracyResult {
    double absoluteError;    ///< Абсолютная погрешность
    double relativeError;    ///< Относительная погрешность, %
    double reducedError;     ///< Приведённая погрешность, %
    double lsb;              ///< Цена младшего разряда (для АЦП)
    QString normativeRef;
};
class AccuracyCalculator {
public:
    /// Погрешность по классу точности: Δ = класс% * диапазон / 100
    static AccuracyResult fromClass(double accuracyClass, double range);
    /// Приведённая → относительная: δ_отн = δ_прив * диапазон / (100 * значение)
    static double reducedToRelative(double reducedError, double range, double value);
    /// Суммирование погрешностей (корень из суммы квадратов)
    static double combineErrors(const QVector<double>& errors);
    /// АЦП: LSB = диапазон / 2^n
    static double adcResolution(double range, int bits);
};
} // namespace Kipia
#endif
