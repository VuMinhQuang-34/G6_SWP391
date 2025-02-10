// models/ExportOrders.js
module.exports = (sequelize, DataTypes) => {
    const ExportOrders = sequelize.define('ExportOrders', {
      ExportOrderId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      CreatedBy: DataTypes.INTEGER,
      ApprovedBy: DataTypes.INTEGER,
      Created_Date: DataTypes.DATE,
      ApprovedDate: DataTypes.DATE,
      Status: DataTypes.STRING,
      Reason: DataTypes.STRING,
      Note: DataTypes.STRING
    }, {
      tableName: 'ExportOrders',
      timestamps: false
    });
  
    ExportOrders.associate = function(models) {
      // 1 ExportOrder thuộc về User (CreatedBy)
      ExportOrders.belongsTo(models.User, { 
        foreignKey: 'CreatedBy',
        as: 'Creator'
      });
      // 1 ExportOrder có thể được ApprovedBy 1 User khác
      ExportOrders.belongsTo(models.User, { 
        foreignKey: 'ApprovedBy',
        as: 'Approver'
      });
  
      // 1 ExportOrder có nhiều chi tiết
      ExportOrders.hasMany(models.ExportOrderDetails, {
        foreignKey: 'ExportOrderId'
      });
  
      // Tương tự liên kết đến OrderStatusLogs (nếu OrderType = 'export')
    };
  
    return ExportOrders;
  };
  