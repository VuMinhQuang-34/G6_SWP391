const defaultUsers = {
    up: async (queryInterface, Sequelize) => {
        const currentDate = new Date();
        await queryInterface.bulkInsert('User', [
            {
                userId: 1,
                FullName: 'Admin User',
                Email: 'admin@example.com',
                Password: '$2a$10$aMYMSiy5GXmIX3kU1HX8BOb0l7G0RvznW2c9ELA0hfFAYz5xQki4.',
                roleId: 1, // Admin role
                Status: 'Active',
                Created_Date: currentDate,
                Edit_Date: currentDate,
                PhoneNumber: '0123456789'
            },
            {
                userId: 2,
                FullName: 'Manager User',
                Email: 'manager@example.com',
                Password: '$2a$10$aMYMSiy5GXmIX3kU1HX8BOb0l7G0RvznW2c9ELA0hfFAYz5xQki4.',
                roleId: 2, // Manager role
                Status: 'Active',
                Created_Date: currentDate,
                Edit_Date: currentDate,
                PhoneNumber: '0123456788'
            },
            {
                userId: 3,
                FullName: 'Staff User',
                Email: 'staff@example.com',
                Password: '$2a$10$aMYMSiy5GXmIX3kU1HX8BOb0l7G0RvznW2c9ELA0hfFAYz5xQki4.',
                roleId: 3, // Staff role
                Status: 'Active',
                Created_Date: currentDate,
                Edit_Date: currentDate,
                PhoneNumber: '0123456787'
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('User', null, {});
    }
};

export default defaultUsers; 