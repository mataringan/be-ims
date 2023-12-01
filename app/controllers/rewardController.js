const { v4: uuid } = require("uuid");
const { Reward } = require("../models");
const { TransactionPoints } = require("../models");
const { Op } = require("sequelize");

module.exports = {
    async createReward(req, res) {
        try {
            if (req.user.role === "admin" || req.user.role === "super admin") {
                const { point, discount, description } = req.body;

                const reward = await Reward.create({
                    id: uuid(),
                    point,
                    discount,
                    description,
                });

                res.status(200).json({
                    status: "success",
                    message: "create reward successfully",
                    data: reward,
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async getReward(req, res) {
        try {
            const reward = await Reward.findAll();

            res.status(200).json({
                status: "success",
                message: "get all reward successfully",
                data: reward,
            });
        } catch (error) {
            return res.status(500).json({
                status: "success",
                message: error.message,
            });
        }
    },

    async getAvailableRewards(req, res) {
        try {
            const phone = req.query.phone ? req.query.phone : "";

            console.log("Phone:", phone);

            const transactionPoints = await TransactionPoints.findOne({
                where: {
                    phone,
                },
            });

            if (transactionPoints) {
                const availableRewards = await Reward.findAll({
                    where: {
                        point: {
                            [Op.lte]: transactionPoints.points_balance,
                        },
                    },
                });

                return res.status(200).json({
                    status: "success",
                    message: "Get available rewards successfully",
                    data: availableRewards,
                });
            } else {
                return res.status(200).json({
                    status: "success",
                    message:
                        "No transaction points found for the specified phone number",
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

    async getRewardById(req, res) {
        try {
            const id = req.params.id;

            const reward = await Reward.findOne({
                where: {
                    id,
                },
            });

            res.status(200).json({
                status: "success",
                message: "get reward by id successfully",
                data: reward,
            });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async updateReward(req, res) {
        try {
            const id = req.params.id;
            const { point, discount, description } = req.body;

            if (req.user.role === "admin" || req.user.role === "super admin") {
                const reward = await Reward.findOne({
                    where: {
                        id,
                    },
                });

                reward.point = point;
                reward.discount = discount;
                reward.description = description;

                await reward.save();

                res.status(200).json({
                    status: "success",
                    message: "update reward successfully",
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async deleteReward(req, res) {
        try {
            const id = req.params.id;

            if (req.user.role === "admin" || req.user.role === "super admin") {
                Reward.destroy({
                    where: {
                        id,
                    },
                })
                    .then(() => {
                        res.status(200).json({
                            status: "success",
                            message: "delete reward successfully",
                        });
                    })
                    .catch((err) => {
                        return res.status(400).json({
                            status: "error",
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
