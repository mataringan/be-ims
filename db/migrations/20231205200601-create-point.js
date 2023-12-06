"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Points", {
            id: {
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
            },
            userId: {
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                type: Sequelize.UUID,
                primaryKey: true,
            },
            point: {
                type: Sequelize.INTEGER,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Points");
    },
};
