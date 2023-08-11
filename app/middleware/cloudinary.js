const cloudinary = require("cloudinary").v2;

// Konfigurasi Cloudinary (ganti cloud_name, api_key, dan api_secret dengan konfigurasi Anda)
cloudinary.config({
  cloud_name: "dv6pynzdb",
  api_key: "582359867132745",
  api_secret: "y1c3S19Bu5MsDF3AanK23TIwx4Q",
});

module.exports = cloudinary;
