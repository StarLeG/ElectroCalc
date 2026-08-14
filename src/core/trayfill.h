// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0
#ifndef CORE_TRAYFILL_H
#define CORE_TRAYFILL_H
#include <QString>
#include <QVector>
namespace Core {
struct TrayFillResult {
    double totalCableArea;   ///< Суммарная площадь кабелей, мм²
    double trayArea;         ///< Площадь лотка/трубы, мм²
    double fillPercent;      ///< Заполнение, %
    double minTrayWidth;     ///< Мин. ширина лотка, мм
    double minPipeDiameter;  ///< Мин. диаметр трубы, мм
    QString normativeRef;
};
class TrayFillCalculator {
public:
    static TrayFillResult calculate(const QVector<double>& cableSections,
                                    double trayWidth, double trayHeight);
    static double minPipeDiameter(const QVector<double>& cableSections);
};
} // namespace Core
#endif
