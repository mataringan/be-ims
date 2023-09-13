const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const SALT = 10;
const jwt = require("jsonwebtoken");
const { User } = require("../models");

function encryptPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, SALT, (err, encryptedPassword) => {
      if (!!err) {
        reject(err);
        return;
      }

      resolve(encryptedPassword);
    });
  });
}

module.exports = {
  async forgotPass(req, res) {
    try {
      const { email } = req.body;

      const findUserEmail = async () => {
        return await User.findOne({
          where: {
            email,
          },
        });
      };

      // checkEmail
      const userEmail = await findUserEmail();

      // if user not found
      if (!userEmail) {
        res.status(404).json({
          status: "error",
          message: "email not found",
        });
        return;
      }
      // create update token
      const token = jwt.sign(
        { id: userEmail.id },
        process.env.JWT_SIGNATURE_KEY || "Rahasia",
        {
          expiresIn: "1h",
        }
      );

      // create transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        service: "gmail",
        auth: {
          user: "backendproject010101@gmail.com",
          pass: "fzkeehrkmvvsaaao",
        },
      });

      const mailOptions = {
        from: "backendproject010101@gmail.com",
        to: email,
        subject: "Reset Password",
        html: `   <center style="background-color: #F1F1F1; padding-top: 15px; padding-bottom: 15px;">
                    <table style="background-color: white; text-color:black; border-radius: 5px;  padding-left:25px; padding-right:25px; padding-bottom:25px;"> 
                      <div>
                        <img src="https://i.postimg.cc/3wHCdWxd/image-auth.jpg" style= "width:120; height: 100px; margin-top:5px;">
                      </div>
                        <p style="color: black; margin-bottom: 15px; font-size: 17px; font-family: Arial, sans-serif"><b>Reset Password</p>
                        <p style="color: black; margin-bottom: 15px; font-size: 15px; font-family: Arial, sans-serif">You have just requested to reset your password. "Press the button below to continue"</p>
                          <center>
                            <button 
                              style=
                              "
                                border: none;
                                transition-duration: 0.4s;
                                cursor: pointer;
                                background-color: #7126B5;
                                border-radius: 12px;
                                margin-top: 20px;
                                margin-bottom: 20px;
                              "
                              type="button"> 
        
                              <a 
                                style=
                                  "
                                    text-decoration: none;
                                    text-align: center;
                                    text-decoration: none;
                                    display: inline-block;
                                    font-size: 16px;
                                    margin: 2px 2px; color: white;
                                    padding: 7px 6px;
                                    transition-duration: 0.4s;" 
                                    href='http://localhost:3000/reset?token=${token}' target="_blank" rel="reset">Reset Password</a>
                            </button>
                          </center>
                      <p style="font-size: 17px; color:black;font-weight: bold; text-align: left; font-family: Arial, sans-serif">Note:</p>
                        <ul type="circle">
                          <li style="padding: 10px; color:black; font-size: 15px; text-align: left; font-family: Arial, sans-serif">The code is only valid for 60 seconds.</li>
                          <li style="padding: 10px; color:black; font-size: 15px; text-align: left; font-family: Arial, sans-serif">If you didn't request this code, you can ignore this message.</li>
                        </ul>
                        
                    </table> 
                  <center>
                            `,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).send({
        status: "Success",
        message: "Check your email to reset password",
      });
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: error.message,
      });
    }
  },
  async resetPass(req, res) {
    const { password, confirmPassword } = req.body;
    try {
      const token = req.headers.authorization.split(" ")[1];

      // verifikasi token
      const decodedUser = jwt.verify(
        token,
        process.env.JWT_SIGNATURE_KEY || "Rahasia"
      );
      const findUserId = async () => {
        return await User.findOne({
          where: { id: decodedUser.id },
        });
      };

      // get user by id
      const userData = await findUserId();

      // check user
      if (!userData) {
        res.status(400).send({
          status: "error",
          message: "Token reset password not found",
        });
        return;
      }

      // check password
      if (password !== confirmPassword) {
        res.status(400).send({
          status: "error",
          message: "Password not match",
        });
        return;
      }

      // encrypt password
      const encryptedPassword = await encryptPassword(password);

      const updatePassUser = async () => {
        return await User.update(
          {
            password: encryptedPassword,
          },
          {
            where: {
              id: userData.id,
            },
          }
        );
      };

      //   update user password
      const updatedUser = await updatePassUser(userData.id, {
        password: encryptedPassword,
      });

      // send response
      res.status(200).json({
        status: "success",
        message: "update password successfully",
      });
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: error.message,
      });
    }
  },
};
