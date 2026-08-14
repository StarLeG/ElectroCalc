// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include <QApplication>
#include <QDebug>
#include "version.h"
#include "ui/mainwindow.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    app.setApplicationName("EngiCalc");
    app.setApplicationVersion(APP_VERSION_STRING);

    qDebug() << "EngiCalc" << APP_VERSION_STRING
             << "(git:" << APP_GIT_VERSION << ")";

    MainWindow window;
    window.setWindowTitle(QString("EngiCalc %1").arg(APP_VERSION_STRING));
    window.resize(800, 600);
    window.show();

    return app.exec();
}
