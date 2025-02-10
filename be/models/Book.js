// models/Book.js
module.exports = (sequelize, DataTypes) => {
    const Book = sequelize.define('Book', {
      BookId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Title: DataTypes.STRING,
      Author: DataTypes.STRING,      // Nếu bạn vẫn giữ cột Author
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
  
    Book.associate = function(models) {
      // Thuộc về 1 Category
      Book.belongsTo(models.Category, {
        foreignKey: 'CategoryId'
      });
  
      // many-to-many với Author
      Book.belongsToMany(models.Author, {
        through: models.BookAuthors,
        foreignKey: 'BookId'
      });
  
      // 1 Book có thể nằm trong nhiều phiếu nhập, phiếu xuất
      Book.hasMany(models.ImportOrderDetails, { foreignKey: 'BookId' });
      Book.hasMany(models.ExportOrderDetails, { foreignKey: 'BookId' });
  
      // Liên hệ với Stock
      Book.hasMany(models.Stock, { foreignKey: 'BookId' });
  
      // Liên hệ với Fault
      Book.hasMany(models.Fault, { foreignKey: 'BookId' });
    };
  
    return Book;
  };
  