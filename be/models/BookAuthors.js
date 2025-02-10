// models/BookAuthors.js
export default (sequelize, DataTypes) => {
  const BookAuthors = sequelize.define('BookAuthors', {
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