// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "csvreport.h"
#include <QFile>
#include <QTextStream>

namespace Report {

void CsvReport::addRow(const QString& label, const QString& value, const QString& unit)
{
    m_rows.append({label, {value, unit}});
}

QString CsvReport::generate() const
{
    QString csv;
    csv += "Параметр;Значение;Единица\n";
    for (const auto& row : m_rows) {
        csv += QString("%1;%2;%3\n")
            .arg(row.first)
            .arg(row.second.first)
            .arg(row.second.second);
    }
    return csv;
}

bool CsvReport::saveToFile(const QString& filePath) const
{
    QFile file(filePath);
    if (!file.open(QIODevice::WriteOnly | QIODevice::Text))
        return false;

    // BOM для корректного открытия в Excel
    file.write("\xEF\xBB\xBF");

    QTextStream out(&file);
    out.setEncoding(QStringConverter::Utf8);
    out << generate();
    return true;
}

void CsvReport::clear()
{
    m_rows.clear();
}

} // namespace Report
