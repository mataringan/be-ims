"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Users", {
            id: {
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
            },
            name: {
                type: Sequelize.STRING,
            },
            email: {
                type: Sequelize.STRING,
            },
            verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            password: {
                type: Sequelize.STRING,
            },
            address: {
                type: Sequelize.STRING,
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            role: {
                type: Sequelize.STRING,
            },
            image: {
                type: Sequelize.STRING,
            },
            otp: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            otpExpiration: {
                type: Sequelize.DATE,
                allowNull: true,
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
        await queryInterface.dropTable("Users");
    },
};
