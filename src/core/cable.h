// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef CORE_CABLE_H
#define CORE_CABLE_H

#include <QString>
#include <QVector>

namespace Core {

/// Результат подбора сечения кабеля
struct CableResult {
    double crossSection;   ///< Сечение, мм²
    double diameter;       ///< Диаметр, мм
    double maxCurrent;     ///< Максимальный ток, А
    bool meetsHeating;     ///< Проверка по нагреву
    bool meetsDensity;     ///< Проверка по экономической плотности тока
    bool meetsVoltageDrop; ///< Проверка по потерям напряжения
    bool meetsCorona;      ///< Проверка по коронному разряду
    QString normativeRef;  ///< Нормативная ссылка
};

/// Данные о кабеле из таблиц ПУЭ
struct CableData {
    double crossSection;   ///< Сечение, мм²
    double diameter;       ///< Диаметр, мм
    double maxCurrentCu;   ///< Максимальный ток для Cu, А
    double maxCurrentAl;   ///< Максимальный ток для Al, А
    double resistance;     ///< Активное сопротивление, Ом/км
    double reactance;      ///< Индуктивное сопротивление, Ом/км
};

/// Калькулятор кабелей и проводов
class CableCalculator
{
public:
    /// Подбор сечения по нагреву
    /// @param current Расчётный ток, А
    /// @param material Материал ("Cu" или "Al")
    /// @return Минимальное сечение, мм²
    static CableResult selectByHeating(double current, const QString& material);

    /// Проверка по 4 критериям
    /// @param current Расчётный ток, А
    /// @param crossSection Сечение, мм²
    /// @param length Длина линии, м
    /// @param voltage Напряжение, В
    /// @param maxDropPercent Максимальные потери, %
    /// @param material Материал ("Cu" или "Al")
    static CableResult checkAllCriteria(double current, double crossSection,
                                        double length, double voltage,
                                        double maxDropPercent,
                                        const QString& material);

    /// Диаметр по сечению: d = 2 * √(S/π)
    static double diameterFromSection(double crossSection);

    /// Получить таблицу кабелей (сечения из ПУЭ)
    static QVector<CableData> cableTable();

private:
    static double economicDensity(const QString& material);
};

} // namespace Core

#endif // CORE_CABLE_H
