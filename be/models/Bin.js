export default (sequelize, DataTypes) => {
    const Bin = sequelize.define('Bin', {
        BinId: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        ShelfId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Quantity_Max_Limit: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        Quantity_Current: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Description: {
            type: DataTypes.STRING,
            allowNull: true
        }
        
    }, {
        tableName: 'Bin',
        timestamps: false
    });

    return Bin;
};
