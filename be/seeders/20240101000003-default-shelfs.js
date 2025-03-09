'use strict';

const defaultShelfs = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('Shelf', [
            {
                ShelfID: "S001",
                WarehouseId: 'WHL'
            },
            {
                ShelfID: "S002",
                WarehouseId: 'WHL'
            },
            {
                ShelfID: "S003",
                WarehouseId: 'WHL'
            },
            {
                ShelfID: "S004",
                WarehouseId: 'WHL'
            },
            {
                ShelfID: "S005",
                WarehouseId: 'WHL'
            },
            {
                ShelfID: "S006",
                WarehouseId: 'WHL'
            },
            {
                ShelfID: "S007",
                WarehouseId: 'WHL'
            },
            {
                ShelfID: "S008",
                WarehouseId: 'WHL'
            }
          
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Shelf', null, {});
    }
};

export default defaultShelfs; 