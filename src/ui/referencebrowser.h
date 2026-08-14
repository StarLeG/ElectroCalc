// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef UI_REFERENCEBROWSER_H
#define UI_REFERENCEBROWSER_H

#include <QWidget>
class QTabWidget;
class QTableView;
class QComboBox;
class QLineEdit;
class QLabel;

namespace Models {
class CableDataModel;
}

namespace Ui {

class ReferenceBrowser : public QWidget
{
    Q_OBJECT

public:
    explicit ReferenceBrowser(QWidget *parent = nullptr);

private:
    void setupCableTable(QWidget* parent, QTabWidget* tabs);
    void setupConverter(QWidget* parent, QTabWidget* tabs);
    void setupReference(QWidget* parent, QTabWidget* tabs);

    Models::CableDataModel* m_cableModel;
    QComboBox* m_converterFrom;
    QComboBox* m_converterTo;
    QLineEdit* m_converterInput;
    QLabel* m_converterResult;
};

} // namespace Ui

#endif // UI_REFERENCEBROWSER_H
