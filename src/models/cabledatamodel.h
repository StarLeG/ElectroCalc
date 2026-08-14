// EngiCalc — Инженерные расчёты: электрика, КИПиА, автоматика
// Copyright (C) 2026 Старинский Олег Григорьевич
// Licensed under LGPL v3.0

#ifndef MODELS_CABLEDATAMODEL_H
#define MODELS_CABLEDATAMODEL_H

#include <QAbstractTableModel>
#include <QVector>

namespace Models {

struct CableDataRow {
    double crossSection;   ///< Сечение, мм²
    double diameter;       ///< Диаметр, мм
    double maxCurrentCu;   ///< Макс. ток Cu, А
    double maxCurrentAl;   ///< Макс. ток Al, А
    double resistanceCu;   ///< R Cu, Ом/км
    double resistanceAl;   ///< R Al, Ом/км
    double reactance;      ///< X, Ом/км
    double weightCu;       ///< Масса Cu, кг/км
    double weightAl;       ///< Масса Al, кг/км
};

/// Модель данных кабелей (таблицы ПУЭ)
class CableDataModel : public QAbstractTableModel
{
    Q_OBJECT

public:
    enum Column {
        ColSection = 0,
        ColDiameter,
        ColMaxCurrentCu,
        ColMaxCurrentAl,
        ColResistanceCu,
        ColResistanceAl,
        ColReactance,
        ColWeightCu,
        ColWeightAl,
        ColumnCount
    };

    explicit CableDataModel(QObject *parent = nullptr);

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    int columnCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role = Qt::DisplayRole) const override;
    QVariant headerData(int section, Qt::Orientation orientation, int role = Qt::DisplayRole) const override;

    /// Получить строку данных
    const CableDataRow& row(int index) const;

    /// Найти строку по сечению
    int findSection(double crossSection) const;

private:
    void loadData();
    QVector<CableDataRow> m_data;
};

} // namespace Models

#endif // MODELS_CABLEDATAMODEL_H
