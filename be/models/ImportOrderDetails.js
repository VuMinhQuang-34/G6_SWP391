export default (sequelize, DataTypes) => {
  const ImportOrderDetails = sequelize.define('ImportOrderDetails', {
    ImportOrderDetailId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ImportOrderId: DataTypes.INTEGER,
    BookId: DataTypes.INTEGER,
    Quantity: DataTypes.INTEGER,
    Price: DataTypes.DECIMAL(10, 2)
  }, {
    tableName: 'ImportOrderDetails',
    timestamps: false
  });

  ImportOrderDetails.associate = function (models) {
    ImportOrderDetails.belongsTo(models.ImportOrders, { foreignKey: 'ImportOrderId', constraints: false });
    ImportOrderDetails.belongsTo(models.Book, { foreignKey: 'BookId', constraints: false });
  };

    return ImportOrderDetails;
};
