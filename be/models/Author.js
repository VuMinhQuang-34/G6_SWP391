// models/Author.js
export default (sequelize, DataTypes) => {
  const Author = sequelize.define('Author', {
    authorId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Name: DataTypes.STRING
  }, {
    tableName: 'Author',
    timestamps: false
  });

  Author.associate = function (models) {
    Author.belongsToMany(models.Book, {
      through: models.BookAuthors,
      foreignKey: 'AuthorId'
    });
  };

  return Author;
};