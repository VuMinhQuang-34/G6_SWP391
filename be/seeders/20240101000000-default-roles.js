'use strict';

const defaultRoles = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('Role', [
            {
                roleId: 1,
                Role_Name: 'Admin'
            },
            {
                roleId: 2,
                Role_Name: 'Manager'
            },
            {
                roleId: 3,
                Role_Name: 'Staff'
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Role', null, {});
    }
};

export default defaultRoles; 