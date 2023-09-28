const { User } = require("../models");

module.exports = {
    async getAllUser(req, res) {
        try {
            const dataUser = await User.findAll({
                where: {
                    role: "karyawan",
                },
            });

            res.status(200).json({
                status: "success",
                message: "get all user success",
                data: dataUser,
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },
};
