// models/Category.js
export default (sequelize, DataTypes) => {
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

  Category.associate = function (models) {
    Category.hasMany(models.Book, {
      foreignKey: 'CategoryId'
    });
  };

  return Category;
};