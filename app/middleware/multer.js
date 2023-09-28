const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const maxSize = 1024 * 1024 * 20;

module.exports = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype == "image/png" ||
            file.mimetype == "image/jpg" ||
            file.mimetype == "image/jpeg"
        ) {
            cb(null, true);
        } else {
            cb("Format file must be PNG, JPG, or JPEG", false);
        }
    },
    limits: { fileSize: maxSize },
}).single("image");
