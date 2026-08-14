// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef REPORT_CSVREPORT_H
#define REPORT_CSVREPORT_H

#include <QString>
#include <QVector>
#include <QPair>

namespace Report {

/// Экспорт результатов расчёта в CSV
class CsvReport
{
public:
    /// Добавить строку данных
    void addRow(const QString& label, const QString& value, const QString& unit = "");

    /// Сформировать CSV-содержимое
    QString generate() const;

    /// Сохранить в файл
    bool saveToFile(const QString& filePath) const;

    /// Очистить данные
    void clear();

private:
    QVector<QPair<QString, QPair<QString, QString>>> m_rows; // label -> (value, unit)
};

} // namespace Report

#endif // REPORT_CSVREPORT_H
