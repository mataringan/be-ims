const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { v4: uuid } = require("uuid");
const nodemailer = require("nodemailer");
const salt = 10;
const cloudinary = require("../middleware/cloudinary");

function encryptPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, salt, (err, encryptedPassword) => {
      if (!!err) {
        reject(err);
        return;
      }
      resolve(encryptedPassword);
    });
  });
}

function checkPassword(encryptedPassword, password) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, encryptedPassword, (err, isPasswordCorrect) => {
      if (!!err) {
        reject(err);
        return;
      }
      resolve(isPasswordCorrect);
    });
  });
}

function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SIGNATURE_KEY || "Rahasia");
}

// Generate OTP
function generateOTP() {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

module.exports = {
  async sendOTPByEmail(email, otp) {
    try {
      // configure nodemailer transporter
      const transporter = nodemailer.createTransport({
        // host: "smtp.gmail.com",
        // port: 465,
        // secure: true,
        service: "gmail",
        auth: {
          user: "backendproject010101@gmail.com",
          pass: "fzkeehrkmvvsaaao",
        },
      });

      // compose email message
      const mailOptions = {
        from: "backendproject010101@gmail.com",
        to: email,
        subject: "OTP Verification",
        html: ` 
            <div style: "justify-content: center;">
            <img src="https://i.postimg.cc/3wHCdWxd/image-auth.jpg" style= "height: 150px;">
            </div>
            <center>
            <h1 style="text-align: center; font-family: Arial, sans-serif; background-color: #DEC9FF;">Verification Code</h1>
            <p style="font-size: 17px; text-align: left; font-family: Arial, sans-serif";">To verify your account, enter this code below:</p>
            <p style="font-size: 26px; font-weight: bold; text-align: center; font-family: Arial, sans-serif;">${otp}</p>
            </center>`,
      };

      // send email
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  },

  async verifyUser(req, res) {
    try {
      const { otp } = req.body;

      if (!otp) {
        return res.status(400).json({
          status: "error",
          message: "OTP is required",
        });
      }

      const findUser = await User.findOne({
        where: {
          otp: otp,
        },
      });

      if (!findUser) {
        return res.status(404).json({
          status: "error",
          message: "Invalid OTP",
        });
      }

      // check if OTP has expired
      const currentDateTime = new Date();
      const otpExpiration = new Date(findUser.otpExpiration);

      if (currentDateTime > otpExpiration) {
        return res.status(400).json({
          status: "error",
          message: "OTP has expired",
        });
      }

      findUser.verified = true;
      await findUser.save();

      res.status(200).json({
        status: "success",
        message: "user verified successfully",
        data: findUser,
      });
    } catch (error) {
      return res.status(500).json({
        status: "failed",
        message: error.message,
      });
    }
  },

  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: "error",
          message: "Email is required",
        });
      }

      const user = await User.findOne({
        where: {
          email,
        },
      });

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      // Generate new OTP
      const newOTP = generateOTP();
      const otpExpirationValidity = 1; // Menentukan validitas kedaluwarsa OTP dalam menit
      const otpExpiration = new Date();
      otpExpiration.setMinutes(
        otpExpiration.getMinutes() + otpExpirationValidity
      ); // Menambahkan waktu kedaluwarsa OTP dalam menit

      user.otp = newOTP;
      user.otpExpiration = otpExpiration.toISOString();
      user.verified = false;
      await user.save();

      // Send new OTP to user's email
      module.exports.sendOTPByEmail(user.email, user.otp);

      res.status(200).json({
        status: "success",
        message: "New OTP sent successfully",
      });
    } catch (error) {
      res.status(400).json({
        status: "failed",
        message: error.message,
      });
    }
  },

  async register(req, res) {
    try {
      const password = await encryptPassword(req.body.password);
      const { name, email, phone } = req.body;

      // check email and password is not empty
      if (!email || !password) {
        return res.status(400).json({
          status: "error",
          message: "Email and password is required",
        });
      }

      // validator email format using regex
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: "error",
          message: "Email format is invalid",
        });
      }

      const findEmail = await User.findOne({
        where: {
          email,
        },
      });

      if (findEmail) {
        return res.status(400).json({
          status: "error",
          message: "email already exist",
          data: {},
        });
      }

      // Generate otp
      const otp = generateOTP();
      const otpExpirationValidity = 1; // Menentukan validitas kedaluwarsa OTP dalam menit
      const otpExpiration = new Date();
      otpExpiration.setMinutes(
        otpExpiration.getMinutes() + otpExpirationValidity
      ); // Menambahkan waktu kedaluwarsa OTP dalam menit

      const userForm = await User.create({
        id: uuid(),
        name: name,
        password: password,
        email: email,
        phone: phone,
        otp,
        otpExpiration: otpExpiration.toISOString(), // Mengubah format tanggal dan waktu menjadi ISO 8601
        verified: false,
        role: "karyawan",
        image:
          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
      });

      // Send OTP to user's email
      module.exports.sendOTPByEmail(userForm.email, userForm.otp);

      res.status(201).json({
        status: "success",
        message: "Verification Link Sent, Please check email!",
        data: userForm,
      });
    } catch (error) {
      res.status(400).json({
        status: "failed",
        message: error.message,
      });
    }
  },

  async registerAdmin(req, res) {
    try {
      const password = await encryptPassword(req.body.password);
      const { name, email, phone } = req.body;

      // check email and password is not empty
      if (!email || !password) {
        return res.status(400).json({
          status: "error",
          message: "Email and password is required",
        });
      }

      // validator email format using regex
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: "error",
          message: "Email format is invalid",
        });
      }

      const findEmail = await User.findOne({
        where: {
          email,
        },
      });

      if (findEmail) {
        return res.status(400).json({
          status: "error",
          message: "email already exist",
          data: {},
        });
      }

      // Generate otp
      const otp = generateOTP();
      const otpExpirationValidity = 1; // Menentukan validitas kedaluwarsa OTP dalam menit
      const otpExpiration = new Date();
      otpExpiration.setMinutes(
        otpExpiration.getMinutes() + otpExpirationValidity
      ); // Menambahkan waktu kedaluwarsa OTP dalam menit

      const userForm = await User.create({
        id: uuid(),
        name: name,
        password: password,
        email: email,
        phone: phone,
        otp,
        otpExpiration: otpExpiration.toISOString(), // Mengubah format tanggal dan waktu menjadi ISO 8601
        verified: false,
        role: "admin",
        image:
          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
      });

      // Send OTP to user's email
      module.exports.sendOTPByEmail(userForm.email, userForm.otp);

      res.status(201).json({
        status: "success",
        message: "Verification Link Sent, Please check email!",
        data: userForm,
      });
    } catch (error) {
      res.status(400).json({
        status: "failed",
        message: error.message,
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const emailUser = await User.findOne({
        where: {
          email,
        },
      });

      if (!emailUser) {
        return res.status(404).json({
          status: "error",
          message: "email not found",
        });
      }

      const isPasswordCorrect = await checkPassword(
        emailUser.password,
        password
      );

      if (!isPasswordCorrect) {
        return res.status(401).json({
          status: "error",
          message: "password salah!",
        });
      }

      if (!emailUser.verified) {
        return res.status(403).json({
          status: "error",
          message: "User not verified",
        });
      }

      const token = createToken({
        id: emailUser.id,
        email: emailUser.email,
        createdAt: emailUser.createdAt,
        updatedAt: emailUser.updatedAt,
      });

      res.status(201).json({
        status: "success",
        token,
        name: emailUser.name,
        email: emailUser.email,
        role: emailUser.role,
        createdAt: emailUser.createdAt,
        updatedAt: emailUser.updatedAt,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "login failed",
        error: error.message,
      });
    }
  },

  async whoami(req, res) {
    const { id, name, email, phone, image, role } = req.user;

    const user = {
      id,
      name,
      email,
      phone,
      image,
      role,
    };

    res.status(200).json({
      status: "success",
      message: "get profile success",
      data: user,
    });
  },
};
