const multer = require("multer");
const multerUpload = require("./multer");

module.exports = errorHandleValidations = (req, res, next) => {
  multerUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        status: "error",
        message: "Failed to upload image",
        error: err,
      });
      return;
    } else if (err) {
      res.status(400).json({
        msg: "Bad Request",
        status: 400,
        errors: err,
      });
      return;
    }
    next();
  });
};
