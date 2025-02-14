// models/Book.js
export default (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    BookId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Title: DataTypes.STRING,
    Author: DataTypes.STRING,
    Publisher: DataTypes.STRING,
    CategoryId: DataTypes.INTEGER,
    PublishingYear: DataTypes.INTEGER,
    NumberOfPages: DataTypes.INTEGER,
    Language: DataTypes.STRING,
    Status: DataTypes.STRING,
    Created_Date: DataTypes.DATE,
    Edit_Date: DataTypes.DATE
  }, {
    tableName: 'Book',
    timestamps: false
  });

  Book.associate = function (models) {
    Book.belongsTo(models.Category, {
      foreignKey: 'CategoryId'
    });


    Book.hasMany(models.ImportOrderDetails, { foreignKey: 'BookId' });
    Book.hasMany(models.ExportOrderDetails, { foreignKey: 'BookId' });
    Book.hasMany(models.Stock, { foreignKey: 'BookId' });
    Book.hasMany(models.Fault, { foreignKey: 'BookId' });
  };

  return Book;
};