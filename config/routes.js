const {
  register,
  verifyUser,
  login,
  whoami,
} = require("../app/controllers/authController");
const handleRoot = require("../app/controllers/root");
const { authorize } = require("../app/middleware/authorize");
const validator = require("../app/middleware/validation");

const router = require("express").Router();

router.get("/", handleRoot);

router.post("/register", validator, register);

router.put("/verify-user", verifyUser);

router.post("/login", login);

router.get("/whoami", authorize, whoami);

module.exports = router;
