// models/OrderStatusLogs.js
module.exports = (sequelize, DataTypes) => {
    const OrderStatusLogs = sequelize.define('OrderStatusLogs', {
      LogId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      OrderId: DataTypes.INTEGER,
      OrderType: DataTypes.STRING, // 'import' hoặc 'export'
      Status: DataTypes.STRING,
      ChangeBy: DataTypes.INTEGER,
      Created_Date: DataTypes.DATE,
      Note: DataTypes.STRING
    }, {
      tableName: 'OrderStatusLogs',
      timestamps: false
    });
  
    OrderStatusLogs.associate = function(models) {
      // Thuộc về User nào đã thay đổi
      OrderStatusLogs.belongsTo(models.User, {
        foreignKey: 'ChangeBy'
      });
      
      // Tuỳ cách bạn triển khai, 
      // – Nếu bạn làm cột OrderType = 'import'/'export', có thể phải code handle 
      //   tại controller để liên kết sang ImportOrders/ExportOrders
    };
  
    return OrderStatusLogs;
  };
  