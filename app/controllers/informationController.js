const { Information } = require("../models");
const { v4: uuid } = require("uuid");

module.exports = {
    async createInformation(req, res) {
        const { title, content, date } = req.body;

        try {
            if (req.user.role === "admin") {
                const information = await Information.create({
                    id: uuid(),
                    title,
                    content,
                    date,
                });

                res.status(201).json({
                    status: "success",
                    message: "create information successfully",
                    data: information,
                });
            } else {
                return res.status(500).json({
                    status: "failed",
                    message: "admin only",
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async getAllInformation(req, res) {
        try {
            const information = await Information.findAll({
                order: [["createdAt", "DESC"]], // Mengurutkan berdasarkan createdAt dari yang terbaru
                limit: 10, // Batasan jumlah tr
            });

            res.status(200).json({
                status: "success",
                message: "get all data information successfully",
                data: information,
            });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async getInformationByID(req, res) {
        const informationId = req.params.id;
        try {
            const information = await Information.findOne({
                where: {
                    id: informationId,
                },
            });

            res.status(200).json({
                status: "success",
                message: "get data information successfully",
                data: information,
            });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async updateInformation(req, res) {
        const informationId = req.params.id;
        const { title, content, date } = req.body;

        try {
            if (req.user.role === "admin") {
                const information = await Information.findOne({
                    where: {
                        id: informationId,
                    },
                });

                information.title = title;
                information.content = content;
                information.date = date;

                await information.save();

                res.status(200).json({
                    status: "success",
                    message: "update information successfully",
                    data: information,
                });
            } else {
                return res.status(500).json({
                    status: "failed",
                    message: "admin only",
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async deleteInformation(req, res) {
        const informationId = req.params.id;
        try {
            if (req.user.role === "admin") {
                Information.destroy({
                    where: {
                        id: informationId,
                    },
                })
                    .then(() => {
                        res.status(200).json({
                            status: "success",
                            message: "delete information successfully",
                        });
                    })
                    .catch((err) => {
                        return res.status(400).json({
                            status: "failed",
                            message: err.message,
                        });
                    });
            } else {
                return res.status(500).json({
                    status: "failed",
                    message: "admin only",
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
