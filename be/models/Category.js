// models/Category.js
module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
      categoryId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      CategoryName: DataTypes.STRING
    }, {
      tableName: 'Category',
      timestamps: false
    });
  
    Category.associate = function(models) {
      // 1 Category có thể có nhiều Book
      Category.hasMany(models.Book, {
        foreignKey: 'CategoryId'
      });
    };
  
    return Category;
  };

  