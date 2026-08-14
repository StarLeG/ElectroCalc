// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef CORE_GROUNDING_H
#define CORE_GROUNDING_H

#include <QString>

namespace Core {

/// Результат расчёта заземления
struct GroundingResult {
    double resistance;       ///< Сопротивление заземления, Ом
    int electrodes;          ///< Количество электродов
    double utilizationCoeff; ///< Коэффициент использования
    QString normativeRef;    ///< Нормативная ссылка
};

/// Данные о грунте
struct SoilData {
    QString name;        ///< Название грунта
    double resistivity;  ///< Удельное сопротивление, Ом·м
};

/// Калькулятор заземления
class GroundingCalculator
{
public:
    /// Одиночный стержневой электрод: R = ρ / (2πL) * ln(4L/d)
    /// @param resistivity Удельное сопротивление грунта, Ом·м
    /// @param length Длина электрода, м
    /// @param diameter Диаметр электрода, м
    static GroundingResult singleRod(double resistivity, double length, double diameter);

    /// Одиночный полосовый электрод: R = ρ / (2πL) * ln(2L²/(b*h))
    /// @param resistivity Удельное сопротивление грунта, Ом·м
    /// @param length Длина полосы, м
    /// @param width Ширина полосы, м
    /// @param depth Глубина заложения, м
    static GroundingResult singleStrip(double resistivity, double length,
                                       double width, double depth);

    /// Контурный электрод (n стержней): R = Rод / (n * η)
    /// @param singleResistance Сопротивление одного электрода, Ом
    /// @param count Количество электродов
    /// @param utilizationCoeff Коэффициент использования (0.5–0.9)
    static GroundingResult multipleElectrodes(double singleResistance,
                                              int count,
                                              double utilizationCoeff);

    /// Подбор числа электродов для требуемого сопротивления
    /// @param requiredResistance Требуемое сопротивление, Ом
    /// @param singleResistance Сопротивление одного электрода, Ом
    /// @param utilizationCoeff Коэффициент использования
    static int selectElectrodeCount(double requiredResistance,
                                    double singleResistance,
                                    double utilizationCoeff);

    /// Таблица типовых грунтов
    static QVector<SoilData> soilTable();
};

} // namespace Core

#endif // CORE_GROUNDING_H
