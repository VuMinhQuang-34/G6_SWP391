// models/Shelf.js
export default (sequelize, DataTypes) => {
    const Shelf = sequelize.define('Shelf', {
        ShelfId: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        WarehouseId: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "WHL" // Luôn mặc định "WHL"
        }
    }, {
        tableName: 'Shelf',
        timestamps: false
    });

    return Shelf;
};
