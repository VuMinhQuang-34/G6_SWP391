'use strict';

const defaultWarehouses = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('Warehouse', [
            {
                WarehouseId: "WHL"
            }
           
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Warehouse', null, {});
    }
};

export default defaultWarehouses; 