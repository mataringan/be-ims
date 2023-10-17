const { v4: uuid } = require("uuid");
const { User } = require("../models");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const salt = 10;
const { Op } = require("sequelize");
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
        bcrypt.compare(
            password,
            encryptedPassword,
            (err, isPasswordCorrect) => {
                if (!!err) {
                    reject(err);
                    return;
                }
                resolve(isPasswordCorrect);
            }
        );
    });
}

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

    async createUser(req, res) {
        try {
            const password = await encryptPassword(req.body.password);
            const { name, email, phone, address, role } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    status: "error",
                    message: "Email and Password is required",
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

            if (req.user.role === "admin" || req.user.role === "super admin") {
                const addUser = await User.create({
                    id: uuid(),
                    name,
                    email,
                    phone,
                    address,
                    otp,
                    otpExpiration: otpExpiration.toISOString(), // Mengubah format tanggal dan waktu menjadi ISO 8601
                    verified: false,
                    role,
                    password,
                    image: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
                });

                res.status(201).json({
                    status: "success",
                    message: `create data ${role} successfully, please check email for verify`,
                    data: addUser,
                });

                module.exports.sendOTPByEmail(addUser.email, addUser.otp);
            } else {
                return res.status(403).json({
                    status: "failed",
                    message: "only admin or super admin create user",
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async getAllUser(req, res) {
        try {
            const name = req.query.name ? req.query.name : "";
            const address = req.query.address ? req.query.address : "";
            const role = req.query.role ? req.query.role : "";

            const querySearch = {
                name: {
                    [Op.iLike]: `%${name}%`,
                },
            };

            if (address) {
                querySearch.address = {
                    [Op.iLike]: `%${address}%`,
                };
            }

            let roleCondition;

            if (role) {
                roleCondition = role;
            } else {
                roleCondition = ["karyawan", "cabang"]; // Jika role tidak diinputkan, cari "karyawan" atau "cabang"
            }

            const dataUser = await User.findAll({
                where: {
                    ...querySearch,
                    role: roleCondition,
                },
                order: [["createdAt", "DESC"]],
                limit: 10,
            });

            if (dataUser) {
                const data = dataUser.map((user) => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    role: user.role,
                }));

                res.status(200).json({
                    status: "success",
                    message: "get all user success",
                    data: data,
                });
            } else {
                res.status(404).json({
                    status: "success",
                    message: "Tidak ada pengguna ditemukan.",
                    data: [],
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async getAllUserBySuperAdmin(req, res) {
        try {
            const name = req.query.name ? req.query.name : "";
            const address = req.query.address ? req.query.address : "";
            const role = req.query.role ? req.query.role : "";

            const querySearch = {
                name: {
                    [Op.iLike]: `%${name}%`,
                },
            };

            if (address) {
                querySearch.address = {
                    [Op.iLike]: `%${address}%`,
                };
            }

            let roleCondition;

            if (role) {
                roleCondition = role;
            } else {
                roleCondition = ["karyawan", "cabang", "admin"]; // Jika role tidak diinputkan, cari "karyawan" atau "cabang"
            }

            const dataUser = await User.findAll({
                where: {
                    ...querySearch,
                    role: roleCondition,
                },
                order: [["createdAt", "DESC"]],
                limit: 10,
            });

            if (dataUser) {
                const data = dataUser.map((user) => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    role: user.role,
                }));

                res.status(200).json({
                    status: "success",
                    message: "get all user success",
                    data: data,
                });
            } else {
                res.status(404).json({
                    status: "success",
                    message: "Tidak ada pengguna ditemukan.",
                    data: [],
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async getUserById(req, res) {
        try {
            const id = req.params.id;
            if (req.user.role === "admin" || req.user.role === "super admin") {
                const data = await User.findOne({
                    where: {
                        id,
                    },
                });

                if (data) {
                    dataUser = {
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        role: data.role,
                    };
                }

                res.status(200).json({
                    status: "success",
                    message: "get user by id successfully",
                    data: dataUser,
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async updateUser(req, res) {
        try {
            const id = req.params.id;
            const { name, email, phone, address, role } = req.body;
            if (req.user.role === "admin" || req.user.role === "super admin") {
                const user = await User.findOne({
                    where: {
                        id,
                    },
                });

                user.name = name;
                user.email = email;
                user.phone = phone;
                user.address = address;
                user.role = role;

                await user.save();

                res.status(200).json({
                    status: "success",
                    message: "update user successfully",
                    data: user,
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async updateUserWithToken(req, res) {
        try {
            const id = req.user.id;
            const { name, email, phone } = req.body;
            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({
                    status: "error",
                    message: "User not found",
                });
            }

            if (req.file) {
                const fileBase64 = req.file.buffer.toString("base64");
                const file = `data:${req.file.mimetype};base64,${fileBase64}`;

                cloudinary.uploader.upload(
                    file,
                    {
                        folder: "user-ngaos",
                    },
                    async function (err, result) {
                        if (!!err) {
                            res.status(400).json({
                                status: "upload fail",
                                message: err.message,
                            });
                        }

                        user.name = name;
                        user.email = email;
                        user.phone = phone;
                        user.image = result.url;

                        await user.save();

                        res.status(200).json({
                            status: "success",
                            message: "User updated successfully",
                            data: user,
                        });
                    }
                );
            } else {
                user.name = name;
                user.email = email;
                user.phone = phone;

                await user.save();

                res.status(200).json({
                    status: "success",
                    message: "User updated successfully",
                    data: user,
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                status: "error",
                message: "Internal server error",
            });
        }
    },

    async deleteUser(req, res) {
        const id = req.params.id;
        try {
            if (req.user.role === "admin" || req.user.role === "super admin") {
                User.destroy({
                    where: {
                        id,
                    },
                })
                    .then(() => {
                        res.status(200).json({
                            status: "success",
                            message: "delete user successfully",
                        });
                    })
                    .catch((err) => {
                        return res.status(400).json({
                            status: "failed",
                            message: err.message,
                        });
                    });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },
};
