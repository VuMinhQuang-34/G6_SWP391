// models/ExportOrders.js 
import { DataTypes } from 'sequelize';

const ExportOrders = (sequelize) => {
  const ExportOrders = sequelize.define('ExportOrders', {
    ExportOrderId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    CreatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ApprovedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'New'
    },
    Created_Date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ApprovedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ExportDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    Note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    Reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    RecipientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    RecipientPhone: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        is: /^[0-9]{10}$/
      }
    },
    ShippingAddress: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'ExportOrders',
    timestamps: false
  });

  ExportOrders.associate = (models) => {
    ExportOrders.belongsTo(models.User, {
      foreignKey: 'CreatedBy',
      as: 'Creator'
    });
    ExportOrders.belongsTo(models.User, {
      foreignKey: 'ApprovedBy',
      as: 'Approver'
    });
    ExportOrders.hasMany(models.ExportOrderDetails, {
      foreignKey: 'ExportOrderId'
    });
  };

  return ExportOrders;
};

export default ExportOrders;