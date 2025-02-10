// models/ExportOrders.js 
export default (sequelize, DataTypes) => {
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

  ExportOrders.associate = function (models) {
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