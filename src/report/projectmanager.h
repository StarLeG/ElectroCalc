// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef REPORT_PROJECTMANAGER_H
#define REPORT_PROJECTMANAGER_H

#include <QString>
#include <QJsonObject>

namespace Report {

/// Менеджер проектов — сохранение/загрузка JSON
class ProjectManager
{
public:
    /// Сохранить проект в JSON-файл
    static bool saveToFile(const QString& filePath, const QJsonObject& project);

    /// Загрузить проект из JSON-файла
    static QJsonObject loadFromFile(const QString& filePath);

    /// Создать JSON-объект с текущим состоянием калькулятора
    static QJsonObject createProject(const QString& calculator,
                                      const QJsonObject& inputs,
                                      const QJsonObject& results);

    /// Получить название калькулятора из проекта
    static QString calculatorName(const QJsonObject& project);

    /// Получить входные данные из проекта
    static QJsonObject inputs(const QJsonObject& project);

    /// Получить результаты из проекта
    static QJsonObject results(const QJsonObject& project);
};

} // namespace Report

#endif // REPORT_PROJECTMANAGER_H
