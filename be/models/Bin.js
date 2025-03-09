export default (sequelize, DataTypes) => {
    const Bin = sequelize.define('Bin', {
        BinID: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        ShelfID: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'Bin',
        timestamps: false
    });

    return Bin;
};
