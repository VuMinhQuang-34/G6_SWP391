export default (sequelize, DataTypes) => {
    const Bin = sequelize.define('BookBin', {
        BookBinId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        BinId: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        BookId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Quantity: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        tableName: 'BookBin',
        timestamps: false
    });

    return Bin;
};
