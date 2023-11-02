const { TransactionPoints } = require("../models");
const { User } = require("../models");

module.exports = {
    async getPointsByIdUser(req, res) {
        try {
            const userId = req.user.id;
            const points = await TransactionPoints.findAll({
                where: {
                    userId,
                },
                include: [
                    {
                        model: User,
                        attributes: ["name"],
                    },
                ],
                limit: 5,
            });
            const transformedPoints = points.map((point) => ({
                name: point.User.name,
                point: point.points_balance,
            }));

            // Mengurutkan transformedPoints berdasarkan poin (points_balance) dalam urutan menurun
            transformedPoints.sort((a, b) => b.point - a.point);

            res.status(200).json({
                status: "success",
                message: "get points by idUser successfully",
                data: transformedPoints,
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async getPointsByBuyer(req, res) {
        try {
            const points = await TransactionPoints.findAll({
                attributes: ["name", "phone", "points_balance"],
                limit: 7,
            });

            const transformedPoints = points.map((point) => ({
                name: point.name,
                phone: point.phone,
                point: point.points_balance,
            }));

            // Mengurutkan transformedPoints berdasarkan poin (points_balance) dalam urutan menurun
            transformedPoints.sort((a, b) => b.point - a.point);

            res.status(200).json({
                status: "success",
                message: "get points by buyer successfully",
                data: transformedPoints,
            });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },
};
