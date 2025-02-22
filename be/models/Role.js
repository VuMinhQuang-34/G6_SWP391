export default (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    roleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Role_Name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'Role',
    timestamps: false
  });

  Role.associate = function (models) {
    Role.hasMany(models.User, {
      foreignKey: 'roleId',
      constraints: false
    });
  };

  return Role;
};
