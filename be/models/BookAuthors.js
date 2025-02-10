// models/BookAuthors.js
module.exports = (sequelize, DataTypes) => {
    const BookAuthors = sequelize.define('BookAuthors', {
      // Nếu bảng trung gian chỉ có 2 cột khoá ngoại, có thể không cần PK auto-increment
      BookId: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      AuthorId: {
        type: DataTypes.INTEGER,
        primaryKey: true
      }
    }, {
      tableName: 'BookAuthors',
      timestamps: false
    });
  
    return BookAuthors;
  };
  