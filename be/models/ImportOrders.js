export default (sequelize, DataTypes) => {
  const ImportOrders = sequelize.define('ImportOrders', {
    ImportOrderId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    CreatedBy: DataTypes.INTEGER,
    SupplierID: DataTypes.INTEGER,
    Created_Date: DataTypes.DATE,
    ImportDate: DataTypes.DATE,
    Status: DataTypes.STRING,
    Note: DataTypes.STRING
  }, {
    tableName: 'ImportOrders',
    timestamps: false
  });

  ImportOrders.associate = function (models) {
    ImportOrders.belongsTo(models.User, { foreignKey: 'CreatedBy' });
    ImportOrders.hasMany(models.ImportOrderDetails, { foreignKey: 'ImportOrderId' });
  };

  return ImportOrders;
};
