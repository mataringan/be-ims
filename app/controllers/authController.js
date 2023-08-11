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
            <img src="https://i.ibb.co/vw7bv7j/Untitled-design-8-removebg-preview.png" style= "height: 150px;">
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
        res.status(400).json({
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
      res.status(400).json({
        status: "failed",
        message: error.message,
      });
    }
  },

  async register(req, res) {
    try {
      if (req.file == null) {
        res.status(400).json({
          status: "failed",
          message: "you must input image",
        });
        return;
      } else {
        const password = await encryptPassword(req.body.password);
        const { name, email, phone } = req.body;

        const fileBase64 = req.file.buffer.toString("base64");
        const file = `data:${req.file.mimetype};base64,${fileBase64}`;

        cloudinary.uploader.upload(
          file,
          { folder: "auth-ims-ngaos" },
          async function (err, result) {
            if (!!err) {
              res.status(400).json({
                status: "upload fail",
                errors: err.message,
              });
              return;
            }

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
            const otpExpirationValidity = 5; // Menentukan validitas kedaluwarsa OTP dalam menit
            const otpExpiration = new Date();
            otpExpiration.setMinutes(
              otpExpiration.getMinutes() + otpExpirationValidity
            ); // Menambahkan waktu kedaluwarsa OTP dalam menit

            const userForm = await User.create({
              id: uuid(),
              name,
              password,
              email,
              phone,
              otp,
              otpExpiration: otpExpiration.toISOString(), // Mengubah format tanggal dan waktu menjadi ISO 8601
              verified: false,
              role: "karyawan",
              image: result.url,
            });

            // Send OTP to user's email
            module.exports.sendOTPByEmail(userForm.email, userForm.otp);

            res.status(201).json({
              status: "success",
              message: "Verification Link Sent, Please check email!",
              data: userForm,
            });
          }
        );
      }
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
