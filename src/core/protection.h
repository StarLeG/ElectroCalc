// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef CORE_PROTECTION_H
#define CORE_PROTECTION_H

#include <QString>

namespace Core {

/// Результат подбора защиты
struct ProtectionResult {
    double nominalCurrent;  ///< Номинальный ток автомата, А
    QString characteristic; ///< Характеристика (B, C, D)
    double rcdCurrent;      ///< Ток утечки УЗО, мА
    QString normativeRef;   ///< Нормативная ссылка
};

/// Калькулятор автоматической защиты
class ProtectionCalculator
{
public:
    /// Подбор автомата по току нагрузки
    /// @param loadCurrent Расчётный ток нагрузки, А
    /// @param characteristic Характеристика автомата ("B", "C", "D")
    /// @return Номинальный ток автомата, А
    static double selectBreaker(double loadCurrent, const QString& characteristic);

    /// Подбор УЗО по току утечки
    /// @param leakageCurrent Ток утечки, мА
    /// @return Номинальный дифференциальный ток УЗО, мА
    static double selectRCD(double leakageCurrent);

    /// Проверка селективности двух автоматов
    /// @param upstreamCurrent Номинальный ток вводного автомата, А
    /// @param downstreamCurrent Номинальный ток группового автомата, А
    /// @return true если селективность обеспечена
    static bool checkSelectivity(double upstreamCurrent, double downstreamCurrent);

    /// Стандартные номиналы автоматов, А
    static QVector<double> standardBreakerRatings();

    /// Стандартные номиналы УЗО, мА
    static QVector<double> standardRCDRatings();
};

} // namespace Core

#endif // CORE_PROTECTION_H
