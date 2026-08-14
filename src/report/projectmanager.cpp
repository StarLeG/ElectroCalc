// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "projectmanager.h"
#include "version.h"
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QDateTime>

namespace Report {

bool ProjectManager::saveToFile(const QString& filePath, const QJsonObject& project)
{
    QFile file(filePath);
    if (!file.open(QIODevice::WriteOnly))
        return false;

    QJsonDocument doc(project);
    file.write(doc.toJson(QJsonDocument::Indented));
    return true;
}

QJsonObject ProjectManager::loadFromFile(const QString& filePath)
{
    QFile file(filePath);
    if (!file.open(QIODevice::ReadOnly))
        return QJsonObject();

    QJsonDocument doc = QJsonDocument::fromJson(file.readAll());
    return doc.object();
}

QJsonObject ProjectManager::createProject(const QString& calculator,
                                           const QJsonObject& inputs,
                                           const QJsonObject& results)
{
    QJsonObject project;
    project["version"] = APP_VERSION_STRING;
    project["calculator"] = calculator;
    project["timestamp"] = QDateTime::currentDateTime().toString(Qt::ISODate);
    project["inputs"] = inputs;
    project["results"] = results;
    return project;
}

QString ProjectManager::calculatorName(const QJsonObject& project)
{
    return project["calculator"].toString();
}

QJsonObject ProjectManager::inputs(const QJsonObject& project)
{
    return project["inputs"].toObject();
}

QJsonObject ProjectManager::results(const QJsonObject& project)
{
    return project["results"].toObject();
}

} // namespace Report
