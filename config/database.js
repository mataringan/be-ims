require("dotenv").config();
const { DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT } = process.env;

module.exports = {
  development: {
    username: "postgres",
    password: "kurakura",
    database: `ims_development`,
    host: "localhost",
    port: DB_PORT,
    dialect: "postgres",
  },
  test: {
    username: "postgres",
    password: "kurakura",
    database: `ims_test`,
    host: "localhost",
    port: DB_PORT,
    dialect: "postgres",
  },
  production: {
    username: "postgres",
    password: "kurakura",
    database: "ims",
    host: "localhost",
    port: DB_PORT,
    dialect: "postgres",
  },
};
