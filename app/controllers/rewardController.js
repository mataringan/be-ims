const { v4: uuid } = require("uuid");
const { Reward } = require("../models");
const { TransactionPoints } = require("../models");
const { Point } = require("../models");
const { User } = require("../models");
const { Op } = require("sequelize");
const { sendTransactionDataByEmail } = require("./emailController");

module.exports = {
    async createReward(req, res) {
        try {
            if (req.user.role === "admin" || req.user.role === "super admin") {
                const { point, reward, who, description } = req.body;

                const rewardData = await Reward.create({
                    id: uuid(),
                    point,
                    reward,
                    who,
                    description,
                });

                res.status(200).json({
                    status: "success",
                    message: "create reward successfully",
                    data: rewardData,
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

    async getRewardByFarmer(req, res) {
        const who = "buyer";
        try {
            const reward = await Reward.findAll({
                where: {
                    who,
                },
            });

            res.status(200).json({
                status: "success",
                message: "get reward by farmer successfully",
                data: reward,
            });
        } catch (error) {
            return res.status(500).json({
                status: "success",
                message: error.message,
            });
        }
    },

    async getRewardByEmployee(req, res) {
        const who = "employee";
        try {
            const reward = await Reward.findAll({
                where: {
                    who,
                },
            });

            res.status(200).json({
                status: "success",
                message: "get reward by employee successfully",
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
            const who = "buyer";

            console.log("Phone:", phone);

            const transactionPoints = await TransactionPoints.findOne({
                where: {
                    phone,
                },
            });

            if (transactionPoints) {
                const availableRewards = await Reward.findAll({
                    where: {
                        who,
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

    async getAvailableRewardByEmployee(req, res) {
        const userId = req.user.id;
        const who = "employee";

        try {
            const point = await Point.findOne({
                where: {
                    userId,
                },
            });

            const reward = await Reward.findAll({
                where: {
                    who,
                    point: {
                        [Op.lte]: point.point,
                    },
                },
            });

            res.status(200).json({
                status: "success",
                message: "get reward by employee successfully",
                data: reward,
            });
        } catch (error) {
            return res.status(500).json({
                status: "success",
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

    async claimReward(req, res) {
        try {
            const userId = req.user.id;
            const idReward = req.body.idReward;

            const userPoints = await Point.findOne({
                where: {
                    userId,
                },
            });

            const user = await User.findOne({
                where: {
                    id: userId,
                },
            });

            const rewardData = await Reward.findOne({
                where: {
                    id: idReward,
                },
            });

            const pointUser = userPoints.point;
            const pointReward = rewardData.point;

            if (pointUser >= pointReward) {
                userPoints.point -= pointReward;

                await userPoints.save();

                const htmlData = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                .reward-details {
                    width: 80%;
                    margin: 0 auto;
                    border: 1px solid #ccc;
                    padding: 20px;
                }
                .reward-title {
                    text-align: center;
                    font-size: 24px;
                }
                .reward-data {
                    margin-top: 20px;
                }
                .reward-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                .reward-table th, .reward-table td {
                    border: 1px solid #ccc;
                    padding: 8px;
                    text-align: left;
                }
            </style>
        </head>
        <body>
            <div class="reward-details">
                <div class="reward-title">Reward Claim Confirmation</div>
                <div class="reward-data">
                    <p>ID: ${rewardData.id}</p>
                    <p>User: ${user.name}</p>
                    <p>Point: ${rewardData.point}</p>
                    <p>Reward: ${rewardData.reward}</p>
                    <p>Description: ${rewardData.description}</p>
                </div>
            </div>
        </body>
        </html>
    `;
                sendTransactionDataByEmail(user.email, htmlData);

                res.status(200).json({
                    status: "success",
                    message: "claim reward successfully",
                });
            } else {
                return res.status(400).json({
                    status: "error",
                    message: "Poin Tidak Cukup",
                });
            }
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
            const { point, reward, who, description } = req.body;

            if (req.user.role === "admin" || req.user.role === "super admin") {
                const rewardData = await Reward.findOne({
                    where: {
                        id,
                    },
                });

                rewardData.point = point;
                rewardData.reward = reward;
                rewardData.who = who;
                rewardData.description = description;

                await rewardData.save();

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
