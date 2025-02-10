// models/Author.js
module.exports = (sequelize, DataTypes) => {
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
  
    Author.associate = function(models) {
      // many-to-many với Book qua BookAuthors
      Author.belongsToMany(models.Book, {
        through: models.BookAuthors,
        foreignKey: 'AuthorId'
      });
    };
  
    return Author;
  };
  