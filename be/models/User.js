// models/User.js
export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    FullName: DataTypes.STRING,
    Email: DataTypes.STRING,
    Password: DataTypes.STRING,
    roleId: DataTypes.INTEGER,
    Status: DataTypes.STRING,
    Created_Date: DataTypes.DATE,
    Edit_Date: DataTypes.DATE,
    PhoneNumber: DataTypes.STRING
  }, {
    tableName: 'User',
    timestamps: false
  });

  User.associate = function (models) {
    // Khoá ngoại roleId -> Role
    User.belongsTo(models.Role, {
      foreignKey: 'roleId',
      constraints: false
    });

    // 1 User có thể tạo nhiều import/export order, ...
    User.hasMany(models.ImportOrders, { foreignKey: 'CreatedBy', constraints: false });
    User.hasMany(models.ExportOrders, { foreignKey: 'CreatedBy', constraints: false });

    // Hoặc nếu CreatedBy -> Fault
    User.hasMany(models.Fault, { foreignKey: 'CreatedBy', constraints: false });

    // Tương tự ApprovedBy trong ExportOrders...
    User.hasMany(models.ExportOrders, {
      foreignKey: 'ApprovedBy',
      as: 'ApprovedExports',
      constraints: false
    });

    // Trường ChangeBy trong OrderStatusLogs
    User.hasMany(models.OrderStatusLogs, { foreignKey: 'CreatedBy', constraints: false });
  };

  return User;
};
