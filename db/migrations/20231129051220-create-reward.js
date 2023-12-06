"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Rewards", {
            id: {
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
            },
            point: {
                type: Sequelize.INTEGER,
            },
            reward: {
                type: Sequelize.INTEGER,
            },
            who: {
                type: Sequelize.STRING,
            },
            description: {
                type: Sequelize.STRING,
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
        await queryInterface.dropTable("Rewards");
    },
};
