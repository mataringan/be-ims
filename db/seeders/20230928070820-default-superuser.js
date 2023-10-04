"use strict";
const bcrypt = require("bcrypt");
const { uuid } = require("uuidv4");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "Users",
            [
                {
                    id: uuid(),
                    name: "cv ngaos",
                    email: "ngaosberkahfamily.cv@gmail.com",
                    password: bcrypt.hashSync("ngaosjos", 10),
                    verified: true,
                    image: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
                    role: "super admin",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("Users", null, {});
    },
};
