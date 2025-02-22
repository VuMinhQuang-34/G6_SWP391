export default (sequelize, DataTypes) => {
  const Stock = sequelize.define('Stock', {
    StockId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    BookId: DataTypes.INTEGER,
    Quantity: DataTypes.INTEGER,
    MaxStockQuantity: DataTypes.INTEGER,
    MinStockQuantity: DataTypes.INTEGER,
    Edit_Date: DataTypes.DATE,
    Note: DataTypes.STRING,
    Status: DataTypes.STRING
  }, {
    tableName: 'Stock',
    timestamps: false
  });

  Stock.associate = function (models) {
    Stock.belongsTo(models.Book, { foreignKey: 'BookId', constraints: false });
  };

  return Stock;
};
