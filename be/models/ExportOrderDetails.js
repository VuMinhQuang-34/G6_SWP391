// models/ExportOrderDetails.js
export default (sequelize, DataTypes) => {
  const ExportOrderDetails = sequelize.define('ExportOrderDetails', {
    ExportOrderDetailId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ExportOrderId: DataTypes.INTEGER,
    BookId: DataTypes.INTEGER,
    Quantity: DataTypes.INTEGER,
    UnitPrice: DataTypes.DECIMAL(10, 2),
    Note: DataTypes.STRING
  }, {
    tableName: 'ExportOrderDetails',
    timestamps: false
  });

  ExportOrderDetails.associate = function (models) {
    ExportOrderDetails.belongsTo(models.ExportOrders, { foreignKey: 'ExportOrderId' });
    ExportOrderDetails.belongsTo(models.Book, { foreignKey: 'BookId' });
  };

  return ExportOrderDetails;
};