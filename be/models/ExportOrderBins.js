// models/ExportOrderBins.js
import { DataTypes } from 'sequelize';

const ExportOrderBins = (sequelize) => {
    const ExportOrderBins = sequelize.define('ExportOrderBins', {
        ExportOrderBinId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ExportOrderId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        BookId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        BinId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
        }
    }, {
        tableName: 'ExportOrderBins',
        timestamps: false
    });

    ExportOrderBins.associate = (models) => {
        // No foreign key constraints, just associations for querying
        ExportOrderBins.belongsTo(models.ExportOrders, {
            foreignKey: 'ExportOrderId',
        });
        ExportOrderBins.belongsTo(models.Book, {
            foreignKey: 'BookId',
        });
        ExportOrderBins.belongsTo(models.Bin, {
            foreignKey: 'BinId',
        });
    };

    return ExportOrderBins;
};

export default ExportOrderBins; 