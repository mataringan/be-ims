"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Transaction extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.Product, {
                foreignKey: "productId",
            });
            this.belongsTo(models.User, {
                foreignKey: "userId",
            });
        }
    }
    Transaction.init(
        {
            productId: DataTypes.UUID,
            userId: DataTypes.UUID,
            buyer: DataTypes.STRING,
            date: DataTypes.DATEONLY,
            quantity: DataTypes.INTEGER,
            image: DataTypes.STRING,
            address: DataTypes.STRING,
            status: DataTypes.STRING,
            note: DataTypes.STRING,
            amount: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: "Transaction",
        }
    );
    return Transaction;
};
