"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Transactions", {
            id: {
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
            },
            productId: {
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                type: Sequelize.UUID,
                primaryKey: true,
            },
            userId: {
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                type: Sequelize.UUID,
                primaryKey: true,
            },
            buyer: {
                type: Sequelize.STRING,
            },
            date: {
                type: Sequelize.DATEONLY,
            },
            quantity: {
                type: Sequelize.INTEGER,
            },
            image: {
                type: Sequelize.STRING,
            },
            address: {
                type: Sequelize.STRING,
            },
            status: {
                type: Sequelize.STRING,
            },
            note: {
                type: Sequelize.STRING,
            },
            amount: {
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
        await queryInterface.dropTable("Transactions");
    },
};
