require("dotenv").config();
const { DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT } = process.env;

module.exports = {
    development: {
        username: "postgres",
        password: "kurakura",
        database: `pos_development`,
        host: "localhost",
        port: DB_PORT,
        dialect: "postgres",
    },
    test: {
        username: "postgres",
        password: "kurakura",
        database: `pos_test`,
        host: "localhost",
        port: DB_PORT,
        dialect: "postgres",
    },
    production: {
        username: "postgres",
        password: "kurakura",
        database: "pos",
        host: "localhost",
        port: DB_PORT,
        dialect: "postgres",
    },
};
