// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "pdfreport.h"
#include "version.h"
#include <QFile>
#include <QTextStream>
#include <QDate>

namespace Report {

PdfReport::PdfReport()
    : m_title("Протокол расчёта")
{
}

void PdfReport::setTitle(const QString& title) { m_title = title; }
void PdfReport::setObject(const QString& object) { m_object = object; }
void PdfReport::setCustomer(const QString& customer) { m_customer = customer; }
void PdfReport::setExecutor(const QString& executor) { m_executor = executor; }

void PdfReport::addRow(const QString& label, const QString& value, const QString& unit)
{
    m_rows.append({label, value, unit});
}

void PdfReport::addFormula(const QString& formula) { m_formula = formula; }
void PdfReport::addNormative(const QString& reference) { m_normative = reference; }

QString PdfReport::generateHtml() const
{
    QString html = R"(
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1A2230; margin: 40px; }
h1 { font-size: 18px; color: #1E2128; border-bottom: 2px solid #FFB300; padding-bottom: 8px; }
.header { display: flex; justify-content: space-between; margin-bottom: 24px; }
.header-left { }
.header-right { text-align: right; font-size: 11px; color: #64748B; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; }
th { background: #252A33; color: #E6EAF0; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
td { padding: 8px 12px; border-bottom: 1px solid #E2E8F0; }
tr:nth-child(even) { background: #F4F6FA; }
.formula { font-family: 'Consolas', monospace; font-size: 14px; color: #0284C7; background: #F0F9FF; padding: 12px; border-radius: 6px; margin: 16px 0; }
.normative { font-size: 12px; color: #64748B; font-style: italic; margin: 8px 0; }
.footer { margin-top: 40px; font-size: 10px; color: #9AA4B2; border-top: 1px solid #E2E8F0; padding-top: 8px; }
.signature { margin-top: 60px; display: flex; justify-content: space-between; }
.signature-line { width: 200px; border-bottom: 1px solid #1A2230; }
</style>
</head>
<body>
<div class="header">
    <div class="header-left">
        <h1>)" + m_title + R"(</h1>)";

    if (!m_object.isEmpty())
        html += "<p><strong>Объект:</strong> " + m_object + "</p>";
    if (!m_customer.isEmpty())
        html += "<p><strong>Заказчик:</strong> " + m_customer + "</p>";
    if (!m_executor.isEmpty())
        html += "<p><strong>Исполнитель:</strong> " + m_executor + "</p>";

    html += R"(
    </div>
    <div class="header-right">
        <p>Дата: )" + QDate::currentDate().toString("dd.MM.yyyy") + R"(</p>
        <p>EngiCalc )" + APP_VERSION_STRING + R"(</p>
    </div>
</div>

<table>
<tr><th>Параметр</th><th>Значение</th><th>Единица</th></tr>)";

    for (const auto& row : m_rows) {
        html += "<tr><td>" + row.label + "</td><td><strong>" + row.value + "</strong></td><td>" + row.unit + "</td></tr>";
    }

    html += "</table>";

    if (!m_formula.isEmpty()) {
        html += "<div class='formula'>" + m_formula + "</div>";
    }

    if (!m_normative.isEmpty()) {
        html += "<div class='normative'>Нормативная ссылка: " + m_normative + "</div>";
    }

    html += R"(
<div class="signature">
    <div><div class="signature-line"></div><p style="font-size:10px">Исполнитель</p></div>
    <div><div class="signature-line"></div><p style="font-size:10px">Проверил</p></div>
</div>

<div class="footer">
    Сгенерировано в EngiCalc )";
    html += APP_VERSION_STRING;
    html += " (";
    html += APP_GIT_VERSION;
    html += R"()
</div>
</body>
</html>)";

    return html;
}

bool PdfReport::saveAsHtml(const QString& filePath) const
{
    QFile file(filePath);
    if (!file.open(QIODevice::WriteOnly | QIODevice::Text))
        return false;

    QTextStream out(&file);
    out.setEncoding(QStringConverter::Utf8);
    out << generateHtml();
    return true;
}

void PdfReport::clear()
{
    m_title = "Протокол расчёта";
    m_object.clear();
    m_customer.clear();
    m_executor.clear();
    m_rows.clear();
    m_formula.clear();
    m_normative.clear();
}

} // namespace Report
