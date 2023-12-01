"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class TransactionPoints extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.User, {
                foreignKey: "userId",
            });
            this.belongsTo(models.Transaction, {
                foreignKey: "transactionId",
            });
            // this.belongsTo(models.Transaction, {
            //     foreignKey: "phone",
            //     sourceKey: "phone",
            // });
        }
    }
    TransactionPoints.init(
        {
            transactionId: DataTypes.UUID,
            userId: DataTypes.UUID,
            name: DataTypes.STRING,
            email: DataTypes.STRING,
            phone: DataTypes.STRING,
            points_balance: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: "TransactionPoints",
        }
    );
    return TransactionPoints;
};
