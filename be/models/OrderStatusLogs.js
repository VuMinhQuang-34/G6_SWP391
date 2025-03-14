export default (sequelize, DataTypes) => {
  const OrderStatusLogs = sequelize.define('OrderStatusLogs', {
    LogId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    OrderId: DataTypes.INTEGER,
    OrderType: DataTypes.STRING,
    Status: DataTypes.STRING,
    CreatedBy: DataTypes.INTEGER,
    Created_Date: DataTypes.DATE,
    Note: DataTypes.STRING
  }, {
    tableName: 'OrderStatusLogs',
    timestamps: false
  });

  OrderStatusLogs.associate = function (models) {
    OrderStatusLogs.belongsTo(models.User, {
      foreignKey: 'CreatedBy',
      constraints: false
    });
  };

  return OrderStatusLogs;
};
