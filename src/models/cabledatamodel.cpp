// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#include "cabledatamodel.h"
#include <cmath>

namespace Models {

CableDataModel::CableDataModel(QObject *parent)
    : QAbstractTableModel(parent)
{
    loadData();
}

int CableDataModel::rowCount(const QModelIndex &) const
{
    return m_data.size();
}

int CableDataModel::columnCount(const QModelIndex &) const
{
    return ColumnCount;
}

QVariant CableDataModel::data(const QModelIndex &index, int role) const
{
    if (!index.isValid() || index.row() >= m_data.size())
        return QVariant();

    if (role == Qt::DisplayRole || role == Qt::EditRole) {
        const auto& d = m_data[index.row()];
        switch (index.column()) {
            case ColSection:       return d.crossSection;
            case ColDiameter:      return d.diameter;
            case ColMaxCurrentCu:  return d.maxCurrentCu;
            case ColMaxCurrentAl:  return d.maxCurrentAl;
            case ColResistanceCu:  return d.resistanceCu;
            case ColResistanceAl:  return d.resistanceAl;
            case ColReactance:     return d.reactance;
            case ColWeightCu:      return d.weightCu;
            case ColWeightAl:      return d.weightAl;
        }
    }

    if (role == Qt::TextAlignmentRole) {
        return static_cast<int>(Qt::AlignRight | Qt::AlignVCenter);
    }

    return QVariant();
}

QVariant CableDataModel::headerData(int section, Qt::Orientation orientation, int role) const
{
    if (orientation == Qt::Horizontal && role == Qt::DisplayRole) {
        switch (section) {
            case ColSection:       return "S, мм²";
            case ColDiameter:      return "d, мм";
            case ColMaxCurrentCu:  return "Cu, А";
            case ColMaxCurrentAl:  return "Al, А";
            case ColResistanceCu:  return "R Cu, Ом/км";
            case ColResistanceAl:  return "R Al, Ом/км";
            case ColReactance:     return "X, Ом/км";
            case ColWeightCu:      return "Cu, кг/км";
            case ColWeightAl:      return "Al, кг/км";
        }
    }
    return QVariant();
}

const CableDataRow& CableDataModel::row(int index) const
{
    return m_data[index];
}

int CableDataModel::findSection(double crossSection) const
{
    for (int i = 0; i < m_data.size(); ++i) {
        if (std::abs(m_data[i].crossSection - crossSection) < 0.01)
            return i;
    }
    return -1;
}

void CableDataModel::loadData()
{
    // Таблица кабелей из ПУЭ (медные и алюминиевые жилы, до 1000 В)
    // Сечение | Диаметр | Cu А | Al А | R Cu Ом/км | R Al Ом/км | X Ом/км | Cu кг/км | Al кг/км
    m_data = {
        {  1.5,  1.38,   19,   15, 12.07, 20.47, 0.08,    13,     7 },
        {  2.5,  1.78,   27,   21,  7.24, 12.28, 0.08,    22,    12 },
        {  4.0,  2.26,   38,   29,  4.53,  7.68, 0.07,    35,    19 },
        {  6.0,  2.76,   46,   38,  3.02,  5.12, 0.07,    52,    28 },
        { 10.0,  3.57,   70,   55,  1.81,  3.07, 0.07,    87,    47 },
        { 16.0,  4.51,   95,   75,  1.13,  1.92, 0.06,   139,    75 },
        { 25.0,  5.64,  130,  100,  0.72,  1.23, 0.06,   217,   117 },
        { 35.0,  6.68,  160,  125,  0.52,  0.88, 0.06,   304,   164 },
        { 50.0,  7.98,  200,  160,  0.36,  0.62, 0.06,   435,   235 },
        { 70.0,  9.44,  255,  200,  0.26,  0.44, 0.06,   609,   329 },
        { 95.0, 11.00,  310,  245,  0.19,  0.32, 0.06,   830,   448 },
        {120.0, 12.36,  360,  280,  0.15,  0.26, 0.06,  1042,   563 },
        {150.0, 13.82,  410,  320,  0.12,  0.21, 0.06,  1303,   704 },
        {185.0, 15.35,  470,  370,  0.10,  0.17, 0.06,  1606,   867 },
        {240.0, 17.48,  555,  430,  0.08,  0.13, 0.06,  2083,  1124 }
    };
}

} // namespace Models
