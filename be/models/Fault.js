// models/Fault.js
export default (sequelize, DataTypes) => {
  const Fault = sequelize.define('Fault', {
    FaultId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    BookId: DataTypes.INTEGER,
    FaultDate: DataTypes.DATE,
    Quantity: DataTypes.INTEGER,
    Note: DataTypes.STRING,
    CreatedBy: DataTypes.INTEGER,
    Created_date: DataTypes.DATE
  }, {
    tableName: 'Fault',
    timestamps: false
  });

  Fault.associate = function (models) {
    Fault.belongsTo(models.Book, { foreignKey: 'BookId', constraints: false });
    Fault.belongsTo(models.User, { foreignKey: 'CreatedBy', constraints: false });
  };

  return Fault;
};