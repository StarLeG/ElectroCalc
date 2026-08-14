// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef REPORT_PDFREPORT_H
#define REPORT_PDFREPORT_H

#include <QString>
#include <QVector>

namespace Report {

struct ReportRow {
    QString label;
    QString value;
    QString unit;
};

/// Генератор PDF-протоколов
class PdfReport
{
public:
    PdfReport();

    /// Установить заголовок
    void setTitle(const QString& title);
    void setObject(const QString& object);
    void setCustomer(const QString& customer);
    void setExecutor(const QString& executor);

    /// Добавить данные
    void addRow(const QString& label, const QString& value, const QString& unit = "");
    void addFormula(const QString& formula);
    void addNormative(const QString& reference);

    /// Сгенерировать HTML-протокол (для печати в PDF)
    QString generateHtml() const;

    /// Сохранить как HTML (для последующей конвертации в PDF)
    bool saveAsHtml(const QString& filePath) const;

    /// Очистить
    void clear();

private:
    QString m_title;
    QString m_object;
    QString m_customer;
    QString m_executor;
    QVector<ReportRow> m_rows;
    QString m_formula;
    QString m_normative;
};

} // namespace Report

#endif // REPORT_PDFREPORT_H
