const express = require("express");
const app = express();
const router = require("../config/routes");
const methodOverride = require("method-override");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");

const yaml = require("js-yaml");
const fs = require("fs");
const swaggerUI = require("swagger-ui-express");

// const swaggerDocument = yaml.load(fs.readFileSync("docs/openapi.yml", "utf8"));

// //route api-document swagger
// app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Install JSON Request Parser
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

/** set the view engine to ejs */
app.set("view engine", "ejs");

// method override
app.use(methodOverride("_method"));

// app.use(express.static(path.join(__dirname, "../public")));
app.use(router);

module.exports = app;
