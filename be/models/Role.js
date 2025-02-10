// models/Role.js
module.exports = (sequelize, DataTypes) => {
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
  
    Role.associate = function(models) {
      // 1 Role có thể gắn với nhiều User
      Role.hasMany(models.User, { 
        foreignKey: 'roleId',
      });
    };
  
    return Role;
  };
  