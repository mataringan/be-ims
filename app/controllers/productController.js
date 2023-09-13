const { v4: uuid } = require("uuid");
const { Product } = require("../models");
const cloudinary = require("../middleware/cloudinary");

module.exports = {
  async createProduct(req, res) {
    const { name, description, price, category } = req.body;
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "only admin can create products",
        });
      }

      if (req.file == null) {
        res.status(400).json({
          status: "failed",
          message: "you must input image",
        });
        return;
      } else {
        const fileBase64 = req.file.buffer.toString("base64");
        const file = `data:${req.file.mimetype};base64,${fileBase64}`;

        cloudinary.uploader.upload(
          file,
          {
            folder: "product-ngaos",
          },
          async function (err, result) {
            if (!!err) {
              res.status(400).json({
                status: "upload fail",
                message: err.message,
              });
              return;
            }
            Product.create({
              id: uuid(),
              name,
              description,
              price,
              category,
              image: result.url,
            })
              .then((result) => {
                res.status(201).json({
                  status: "success",
                  message: "product created successfully",
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
      return res.status(500).json({
        status: "error",
        message: "failed to create product",
        error: error.message,
      });
    }
  },

  async getAllProduct(req, res) {
    try {
      const dataProduct = await Product.findAll();
      if (!dataProduct) {
        return res.status(404).json({
          status: "failed",
          message: "data product not found",
        });
      }
      res.status(200).json({
        status: "success",
        message: "get all data user success",
        data: dataProduct,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async getProductById(req, res) {
    try {
      const id = req.params.id;
      const dataProduct = await Product.findOne({
        where: {
          id,
        },
      });
      res.status(200).json({
        status: "success",
        message: "get data product success",
        data: dataProduct,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async updateProduct(req, res) {
    try {
      const id = req.params.id;
      const { name, description, price, category } = req.body;
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "only admin can update products",
        });
      }

      // check product by id
      const product = await Product.findOne({ where: { id } });

      // if data product not found
      if (!product) {
        res.status(404).json({
          status: "error",
          message: "product not found",
        });
      }

      if (req.file) {
        const fileBase64 = req.file.buffer.toString("base64");
        const file = `data:${req.file.mimetype};base64,${fileBase64}`;

        cloudinary.uploader.upload(
          file,
          {
            folder: "product-ngaos",
          },
          async function (err, result) {
            if (!!err) {
              res.status(400).json({
                status: "upload fail",
                message: err.message,
              });
            }

            // update product
            product.name = name;
            product.description = description;
            product.price = price;
            product.category = category;
            product.image = result.url;

            // save update product
            await product.save();

            res.status(200).json({
              status: "success",
              message: "product updated successfully",
              data: product,
            });
          }
        );
      } else {
        product.name = name;
        product.description = description;
        product.category = category;
        product.price = price;

        await product.save();

        return res.status(200).json({
          status: "success",
          message: "product updated successfully",
          data: product,
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  async deleteProduct(req, res) {
    try {
      const id = req.params.id;
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "only admin can delete product",
        });
      }
      //check product
      const product = await Product.findOne({ where: { id } });
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "data product not found",
        });
      }
      Product.destroy({
        where: { id },
      })
        .then(() => {
          res.status(200).json({
            status: "success",
            message: "product data deleted successfully",
          });
        })
        .catch((err) => {
          return res.status(422).json({
            status: "error",
            message: err.message,
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
