const { v4: uuid } = require("uuid");
const { Transaction } = require("../models");
const cloudinary = require("../middleware/cloudinary");
const { Product } = require("../models/");
const { Op } = require("sequelize");

module.exports = {
  async createTransaction(req, res) {
    const idUser = req.user.id;
    const { productId, buyer, date, quantity, note, address } = req.body;

    try {
      const product = await Product.findOne({
        where: {
          id: productId,
        },
      });

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "product not found",
        });
      }

      const total = product.price * quantity;

      if (req.file == null) {
        Transaction.create({
          id: uuid(),
          productId,
          userId: idUser,
          buyer,
          date,
          address,
          note,
          quantity,
          amount: total,
        })
          .then((result) => {
            res.status(201).json({
              status: "success",
              message: "create transaction success",
              data: result,
            });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({
              status: "failed",
              message: err,
            });
          });
      } else {
        const fileBase64 = req.file.buffer.toString("base64");
        const file = `data:${req.file.mimetype};base64,${fileBase64}`;

        cloudinary.uploader.upload(
          file,
          { folder: "transaction-ngaos" },
          async function (err, result) {
            if (!!err) {
              res.status(400).json({
                status: "upload fail",
                message: err.message,
              });
              return;
            }
            Transaction.create({
              id: uuid(),
              productId,
              userId: idUser,
              buyer,
              date,
              address,
              note,
              quantity,
              image: result.url,
              amount: total,
            })
              .then((result) => {
                res.status(201).json({
                  status: "success",
                  message: "create transaction success",
                  data: result,
                });
              })
              .catch((err) => {
                console.log(err);
                return res.status(500).json({
                  status: "failed",
                  message: err,
                });
              });
          }
        );
      }
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async getTransactionById(req, res) {
    try {
      const id = req.params.id;

      const transaction = await Transaction.findOne({
        where: {
          id,
        },
      });

      res.status(200).json({
        status: "success",
        message: "get data user by id successfully",
        data: transaction,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async getAllTransactionEmployee(req, res) {
    try {
      const idUser = req.user.id;

      const transaction = await Transaction.findAll({
        where: {
          userId: idUser,
        },
      });

      res.status(200).json({
        status: "success",
        message: "get transaction success",
        data: transaction,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async getAllTransaction(req, res) {
    if (req.user.role === "admin") {
      try {
        const transaction = await Transaction.findAll();
        res.status(200).json({
          status: "success",
          message: "get all transaction success",
          data: transaction,
        });
      } catch (error) {
        return res.status(500).json({
          status: "error",
          message: error.message,
        });
      }
    } else {
      return res.status(500).json({
        status: "forbidden",
        message: "only admin",
      });
    }
  },

  async getTransactionByQuery(req, res) {
    try {
      const buyer = req.query.name;
      const date = req.query.date;
      const address = req.query.address;

      // if (!buyer) {
      //   return res.status(404).json({
      //     status: "error",
      //     message: "buyer not found",
      //   });
      // }

      const querySearch = {
        buyer: {
          [Op.iLike]: `%${buyer}`,
        },
        // address: {
        //   [Op.iLike]: `%${address}`,
        // },
      };

      if (address) {
        querySearch.address = {
          [Op.eq]: address,
        };
      }

      if (date && Date.parse(date)) {
        querySearch.date = {
          [Op.eq]: date,
        };
      }
      const data = await Transaction.findAll({
        where: querySearch,
      });
      res.status(200).json({
        status: "success",
        message: "get transaction by buyer success",
        data,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async updateTransaction(req, res) {
    try {
      const id = req.params.id;
      const { buyer, date, quantity, note, address } = req.body;

      // check transaction by id
      const transaction = await Transaction.findOne({
        where: { id },
      });

      const productId = transaction.productId;
      console.log(productId);

      const product = await Product.findOne({
        where: {
          id: transaction.productId,
        },
      });

      const price = product.price;
      const newAmount = price * quantity;

      if (req.file) {
        const fileBase64 = req.file.buffer.toString("base64");
        const file = `data:${req.file.mimetype};base64,${fileBase64}`;

        cloudinary.uploader.upload(
          file,
          {
            folder: "transaction-ngaos",
          },
          async function (err, result) {
            if (!!err) {
              res.status(400).json({
                status: "upload fail",
                message: err.message,
              });
            }

            // update transaction
            transaction.buyer = buyer;
            transaction.date = date;
            transaction.quantity = quantity;
            transaction.note = note;
            transaction.address = address;
            transaction.image = result.url;
            transaction.amount = newAmount;

            await transaction.save();

            res.status(200).json({
              status: "success",
              message: "update transaction successfully",
              data: transaction,
            });
          }
        );
      } else {
        // update transaction
        transaction.buyer = buyer;
        transaction.date = date;
        transaction.quantity = quantity;
        transaction.note = note;
        transaction.address = address;
        transaction.amount = newAmount;

        await transaction.save();

        res.status(200).json({
          status: "success",
          message: "update transaction successfully",
          data: transaction,
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async deleteTransaction(req, res) {
    try {
      const id = req.params.id;

      const transaction = await Transaction.findOne({
        where: {
          id,
        },
      });

      transaction.destroy().then(() => {
        res.status(200).json({
          status: "success",
          message: "transaction data deleted successfully",
        });
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};
