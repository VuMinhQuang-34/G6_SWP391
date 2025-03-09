export default (sequelize, DataTypes) => {
    const Warehouse = sequelize.define('Warehouse', {
        WarehouseId: {
            type: DataTypes.STRING ,
            primaryKey: true,
            defaultValue: "WHL"
        },
    }, {
        tableName: 'Warehouse',
        timestamps: false
    });

    return Warehouse;
};
