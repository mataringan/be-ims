const { v4: uuid } = require("uuid");
const { Transaction } = require("../models");
const cloudinary = require("../middleware/cloudinary");
const { Product } = require("../models/");
const { TransactionPoints } = require("../models");
const { User } = require("../models");
const { Reward } = require("../models");
const { Op } = require("sequelize");
const { sendTransactionDataByEmail } = require("./emailController");

module.exports = {
    async createTransaction(req, res) {
        const idUser = req.user.id;
        const {
            productId,
            buyer,
            date,
            quantity,
            note,
            status,
            address,
            email,
            phone,
            rewardId,
        } = req.body;

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

            // Decrement the product stock
            await Product.update(
                { stok: product.stok - quantity },
                { where: { id: productId } }
            );

            if (req.file == null) {
                const existingTransactionPoints =
                    await TransactionPoints.findOne({
                        where: {
                            phone,
                        },
                    });

                const transaction = await Transaction.create({
                    id: uuid(),
                    productId,
                    userId: idUser,
                    buyer,
                    date,
                    email,
                    address,
                    note,
                    phone,
                    status,
                    quantity,
                    amount: total,
                });

                const reward = await Reward.findByPk(rewardId);

                if (existingTransactionPoints) {
                    let newAmount;
                    if (reward) {
                        // // Kurangi amount pada transaksi dengan nilai discount reward
                        newAmount = transaction.amount - reward.discount;

                        await existingTransactionPoints.update({
                            points_balance:
                                existingTransactionPoints.points_balance -
                                reward.point,
                        });

                        // Update amount pada transaksi terakhir
                        await Transaction.update(
                            { amount: newAmount },
                            {
                                where: {
                                    id: transaction.id,
                                },
                            }
                        );
                    }
                    // Jika sudah ada transaksi sebelumnya, tambahkan poin baru ke poin yang sudah ada
                    const newPoints = product.point * quantity;
                    const totalPoints =
                        existingTransactionPoints.points_balance + newPoints;

                    // Update poin di transaksi yang sudah ada
                    await existingTransactionPoints.update({
                        points_balance: totalPoints,
                    });

                    const totalDiscountHTML =
                        newAmount !== undefined
                            ? `<p><strong>Total Harga Diskon: ${newAmount}</strong></p>`
                            : "";

                    const htmlData = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                }
                                .invoice {
                                    width: 80%;
                                    margin: 0 auto;
                                    border: 1px solid #ccc;
                                    padding: 20px;
                                }
                                .invoice-header {
                                    text-align: center;
                                }
                                .invoice-title {
                                    font-size: 24px;
                                }
                                .invoice-details {
                                    margin-top: 20px;
                                }
                                .invoice-table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin-top: 20px;
                                }
                                .invoice-table th, .invoice-table td {
                                    border: 1px solid #ccc;
                                    padding: 8px;
                                    text-align: left;
                                }
                                .invoice-total {
                                    text-align: right;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="invoice">
                                <div class="invoice-header">
                                    <div class="invoice-title">Invoice for Your Recent Transaction</div>
                                </div>
                                <div class="invoice-details">
                                    <p>Selamat anda telah mendapatkan ${existingTransactionPoints.points_balance} point</p>
                                    <p>ID Transaksi: ${transaction.id}</p>
                                    <p>Produk: ${product.name}</p>
                                    <p>Pembeli: ${transaction.buyer}</p>
                                    <p>Tanggal: ${transaction.date}</p>
                                    <p>Alamat: ${transaction.address}</p>
                                    <p>Catatan: ${transaction.note}</p>
                                    <p>Status: ${transaction.status}</p>
                                </div>
                                <table class="invoice-table">
                                    <tr>
                                        <th>Jumlah</th>
                                        <th>Total Harga</th>
                                    </tr>
                                    <tr>
                                        <td>${transaction.quantity}</td>
                                        <td>${transaction.amount}</td>
                                    </tr>
                                </table>
                                <div class="invoice-total">
                                    <p><strong>Total Harga: ${transaction.amount}</strong></p>
                                    ${totalDiscountHTML}
                                </div>
                            </div>
                        </body>
                        </html>
                      `;
                    sendTransactionDataByEmail(email, htmlData);
                } else {
                    const transactionPoints = await TransactionPoints.create({
                        id: uuid(),
                        userId: idUser,
                        transactionId: transaction.id,
                        email,
                        name: buyer,
                        phone,
                        points_balance: product.point * quantity,
                    });

                    const htmlData = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            .invoice {
                width: 80%;
                margin: 0 auto;
                border: 1px solid #ccc;
                padding: 20px;
            }
            .invoice-header {
                text-align: center;
            }
            .invoice-title {
                font-size: 24px;
            }
            .invoice-details {
                margin-top: 20px;
            }
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .invoice-table th, .invoice-table td {
                border: 1px solid #ccc;
                padding: 8px;
                text-align: left;
            }
            .invoice-total {
                text-align: right;
            }
        </style>
    </head>
    <body>
        <div class="invoice">
            <div class="invoice-header">
                <div class="invoice-title">Invoice for Your Recent Transaction</div>
            </div>
            <div class="invoice-details">
                <p>Selamat anda telah mendapatkan ${
                    product.point * quantity
                } point</p>
                <p>ID Transaksi: ${transaction.id}</p>
                <p>Produk: ${product.name}</p>
                <p>Pembeli: ${transaction.buyer}</p>
                <p>Tanggal: ${transaction.date}</p>
                <p>Alamat: ${transaction.address}</p>
                <p>Catatan: ${transaction.note}</p>
                <p>Status: ${transaction.status}</p>
                <p>Terima kasih atas pembelian Anda! Setiap kali Anda mencapai kelipatan 40 poin, kami akan memberikan Anda potongan harga sebesar 10 ribu.</p>
            </div>
            <table class="invoice-table">
                <tr>
                    <th>Jumlah</th>
                    <th>Total Harga</th>
                </tr>
                <tr>
                    <td>${transaction.quantity}</td>
                    <td>${transaction.amount}</td>
                </tr>
            </table>
            <div class="invoice-total">
                <p><strong>Total Harga: ${transaction.amount}</strong></p>
            </div>
        </div>
    </body>
    </html>
  `;
                    sendTransactionDataByEmail(email, htmlData);
                }

                res.status(201).json({
                    status: "success",
                    message: "create transaction success, please check email",
                });
            } else {
                const fileBase64 = req.file.buffer.toString("base64");
                const file = `data:${req.file.mimetype};base64,${fileBase64}`;

                cloudinary.uploader.upload(
                    file,
                    {
                        folder: "transaction-ngaos",
                        transformation: [
                            { width: 500, height: 500, crop: "limit" },
                        ],
                    },
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
                            status,
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

    async getTransactionEmail(req, res) {
        try {
            const transactionId = req.body.transactionId;
            const transaction = await Transaction.findOne({
                where: { id: transactionId },
            });
            const dataTransaction = await TransactionPoints.findOne({
                where: {
                    phone: transaction.phone,
                },
            });

            const product = await Product.findOne({
                where: {
                    id: transaction.productId,
                },
            });

            const htmlData = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            .invoice {
                width: 80%;
                margin: 0 auto;
                border: 1px solid #ccc;
                padding: 20px;
            }
            .invoice-header {
                text-align: center;
            }
            .invoice-title {
                font-size: 24px;
            }
            .invoice-details {
                margin-top: 20px;
            }
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .invoice-table th, .invoice-table td {
                border: 1px solid #ccc;
                padding: 8px;
                text-align: left;
            }
            .invoice-total {
                text-align: right;
            }
        </style>
    </head>
    <body>
         <div class="invoice">
            <div class="invoice-header">
                <div class="invoice-title">Invoice for Your Recent Transaction</div>
            </div>
            <div class="invoice-details">
                <p>Selamat anda telah mendapatkan ${dataTransaction.points_balance} point</p>
                <p>ID Transaksi: ${transaction.id}</p>
                <p>Produk: ${product.name}</p>
                <p>Pembeli: ${transaction.buyer}</p>
                <p>Tanggal: ${transaction.date}</p>
                <p>Alamat: ${transaction.address}</p>
                <p>Catatan: ${transaction.note}</p>
                <p>Status: ${transaction.status}</p>
            </div>
            <table class="invoice-table">
                <tr>
                    <th>Jumlah</th>
                    <th>Total Harga</th>
                </tr>
                <tr>
                    <td>${transaction.quantity}</td>
                    <td>${transaction.amount}</td>
                </tr>
            </table>
            <div class="invoice-total">
                <p><strong>Total Harga: ${transaction.amount}</strong></p>
            </div>
        </div>
    </body>
    </html>
  `;
            sendTransactionDataByEmail(transaction.email, htmlData);
            res.status(200).json({
                status: "success",
                message: "get transaction email success, please check email.",
                data: transaction,
            });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error,
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
                include: [
                    {
                        model: Product,
                        where: {
                            id: { [Op.col]: "Transaction.productId" },
                        },
                    },
                    {
                        model: User,
                        where: {
                            id: { [Op.col]: "Transaction.userId" },
                        },
                    },
                    {
                        model: TransactionPoints,
                        attributes: ["name", "email", "phone"],
                    },
                ],
            });

            res.status(200).json({
                status: "success",
                message: "get data user by id successfully",
                data: transaction,
            });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async getTransactionByIdUser(req, res) {
        try {
            if (req.user.role === "admin" || req.user.role === "super admin") {
                const userId = req.params.id;

                const buyer = req.query.name ? req.query.name : "";
                const date = req.query.date ? req.query.date : "";
                const address = req.query.address ? req.query.address : "";
                const status = req.query.status
                    ? req.query.status.toLowerCase()
                    : "";

                const querySearch = {
                    buyer: {
                        [Op.iLike]: `%${buyer}`,
                    },
                };

                if (status) {
                    querySearch.status = {
                        [Op.iLike]: status,
                    };
                }

                if (address) {
                    querySearch.address = {
                        [Op.iLike]: `%${address}%`,
                    };
                }

                if (date && Date.parse(date)) {
                    querySearch.date = {
                        [Op.eq]: date,
                    };
                }

                const transaction = await Transaction.findAll({
                    where: {
                        userId,
                        ...querySearch,
                    },
                    include: [
                        {
                            model: Product,
                            where: {
                                id: { [Op.col]: "Transaction.productId" },
                            },
                        },
                        {
                            model: TransactionPoints,
                            attributes: ["name", "email", "phone"],
                        },
                    ],
                });

                res.status(200).json({
                    status: "success",
                    message: "get transaction by id user successfully",
                    data: transaction,
                });
            } else {
                res.status(403).json({
                    status: "error",
                    message: "only admin or super admin",
                });
            }
        } catch (error) {
            return res.status(500).json({
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
                include: [
                    {
                        model: Product,
                        where: {
                            id: {
                                [Op.col]: "Transaction.productId",
                            },
                        },
                    },
                    {
                        model: User,
                        where: {
                            id: { [Op.col]: "Transaction.userId" },
                        },
                    },
                    {
                        model: TransactionPoints,
                        attributes: ["name", "email", "phone"],
                    },
                ],
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
        if (req.user.role === "admin" || req.user.role === "super admin") {
            const buyer = req.query.name ? req.query.name : "";
            const date = req.query.date ? req.query.date : "";
            const address = req.query.address ? req.query.address : "";
            const status = req.query.status
                ? req.query.status.toLowerCase()
                : "";

            const querySearch = {
                buyer: {
                    [Op.iLike]: `%${buyer}`,
                },
            };

            if (status) {
                querySearch.status = {
                    [Op.iLike]: status,
                };
            }

            if (address) {
                querySearch.address = {
                    [Op.iLike]: `%${address}%`,
                };
            }

            if (date && Date.parse(date)) {
                querySearch.date = {
                    [Op.eq]: date,
                };
            }

            const data = await Transaction.findAll({
                where: querySearch,
                include: [
                    {
                        model: Product,
                        where: {
                            id: {
                                [Op.col]: "Transaction.productId",
                            },
                        },
                    },
                    {
                        model: User,
                        where: {
                            id: { [Op.col]: "Transaction.userId" },
                        },
                    },
                    {
                        model: TransactionPoints,
                        attributes: ["name", "email", "phone"],
                    },
                ],
            });
            res.status(200).json({
                status: "success",
                message: "get transaction by buyer success",
                data,
            });
        } else {
            return res.status(500).json({
                status: "forbidden",
                message: "only admin",
            });
        }
    },

    async getTransactionByQuery(req, res) {
        try {
            const idUser = req.user.id;
            const buyer = req.query.name ? req.query.name : "";
            const date = req.query.date ? req.query.date : "";
            const address = req.query.address ? req.query.address : "";
            const status = req.query.status
                ? req.query.status.toLowerCase()
                : "";

            const querySearch = {
                buyer: {
                    [Op.iLike]: `%${buyer}`,
                },
            };

            if (status) {
                querySearch.status = {
                    [Op.iLike]: status,
                };
            }

            if (address) {
                querySearch.address = {
                    [Op.iLike]: `%${address}%`,
                };
            }

            if (date && Date.parse(date)) {
                querySearch.date = {
                    [Op.eq]: date,
                };
            }
            const data = await Transaction.findAll({
                where: {
                    ...querySearch,
                    userId: idUser,
                },
                include: [
                    {
                        model: Product,
                        where: {
                            id: {
                                [Op.col]: "Transaction.productId",
                            },
                        },
                    },
                    {
                        model: User,
                        where: {
                            id: { [Op.col]: "Transaction.userId" },
                        },
                    },
                    {
                        model: TransactionPoints,
                        attributes: ["name", "email", "phone"],
                    },
                ],
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

    async getTransactionByAddress(req, res) {
        try {
            const dataAddress = await Transaction.findAll();

            // Create a Set to store unique addresses
            const uniqueAddresses = new Set();

            dataAddress.forEach((item) => {
                uniqueAddresses.add(item.address);
            });

            // Convert the Set back to an array
            const formattedDataAddress = Array.from(uniqueAddresses).map(
                (address) => {
                    return {
                        address,
                    };
                }
            );

            res.status(200).json({
                status: "success",
                message: "get transaction by address successfully",
                data: formattedDataAddress,
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async getAllTransaction(req, res) {
        if (req.user.role === "admin" || req.user.role === "super admin") {
            const buyer = req.query.name ? req.query.name : "";
            const date = req.query.date ? req.query.date : "";
            const address = req.query.address ? req.query.address : "";
            const status = req.query.status
                ? req.query.status.toLowerCase()
                : "";

            const querySearch = {
                buyer: {
                    [Op.iLike]: `%${buyer}`,
                },
            };

            if (status) {
                querySearch.status = {
                    [Op.iLike]: status,
                };
            }

            if (address) {
                querySearch.address = {
                    [Op.iLike]: `%${address}%`,
                };
            }

            if (date && Date.parse(date)) {
                querySearch.date = {
                    [Op.eq]: date,
                };
            }

            const data = await Transaction.findAll({
                where: querySearch,
                include: [
                    {
                        model: Product,
                        where: {
                            id: {
                                [Op.col]: "Transaction.productId",
                            },
                        },
                    },
                    {
                        model: User,
                        where: {
                            id: { [Op.col]: "Transaction.userId" },
                        },
                    },
                    {
                        model: TransactionPoints,
                        attributes: ["name", "email", "phone"],
                    },
                ],
                order: [["createdAt", "DESC"]], // Mengurutkan berdasarkan createdAt dari yang terbaru
                limit: 10, // Batasan jumlah transaksi yang akan ditampilkan
            });
            res.status(200).json({
                status: "success",
                message: "get transaction by buyer success",
                data,
            });
        } else {
            return res.status(500).json({
                status: "forbidden",
                message: "only admin",
            });
        }
    },

    async getAllNewTransaction(req, res) {
        if (req.user.role === "admin" || req.user.role === "super admin") {
            const buyer = req.query.name ? req.query.name : "";
            const date = req.query.date ? req.query.date : "";
            const address = req.query.address ? req.query.address : "";
            const status = req.query.status
                ? req.query.status.toLowerCase()
                : "";

            const querySearch = {
                buyer: {
                    [Op.iLike]: `%${buyer}`,
                },
            };

            if (status) {
                querySearch.status = {
                    [Op.iLike]: status,
                };
            }

            if (address) {
                querySearch.address = {
                    [Op.iLike]: `%${address}%`,
                };
            }

            if (date && Date.parse(date)) {
                querySearch.date = {
                    [Op.eq]: date,
                };
            }

            const data = await Transaction.findAll({
                where: querySearch,
                include: [
                    {
                        model: Product,
                        where: {
                            id: {
                                [Op.col]: "Transaction.productId",
                            },
                        },
                    },
                    {
                        model: User,
                        where: {
                            id: { [Op.col]: "Transaction.userId" },
                        },
                    },
                    {
                        model: TransactionPoints,
                        attributes: ["name", "email", "phone"],
                    },
                ],
                order: [["createdAt", "DESC"]], // Mengurutkan berdasarkan createdAt dari yang terbaru
                limit: 10, // Batasan jumlah transaksi yang akan ditampilkan
            });
            res.status(200).json({
                status: "success",
                message: "get transaction by buyer success",
                data,
            });
        }
        if (req.user.role === "karyawan" || req.user.role === "cabang") {
            const idUser = req.user.id;
            const buyer = req.query.name ? req.query.name : "";
            const date = req.query.date ? req.query.date : "";
            const address = req.query.address ? req.query.address : "";
            const status = req.query.status
                ? req.query.status.toLowerCase()
                : "";

            const querySearch = {
                buyer: {
                    [Op.iLike]: `%${buyer}`,
                },
            };

            if (status) {
                querySearch.status = {
                    [Op.iLike]: status,
                };
            }

            if (address) {
                querySearch.address = {
                    [Op.iLike]: `%${address}%`,
                };
            }

            if (date && Date.parse(date)) {
                querySearch.date = {
                    [Op.eq]: date,
                };
            }

            const data = await Transaction.findAll({
                where: {
                    ...querySearch,
                    userId: idUser,
                },
                include: [
                    {
                        model: Product,
                        where: {
                            id: {
                                [Op.col]: "Transaction.productId",
                            },
                        },
                    },
                    {
                        model: User,
                        where: {
                            id: { [Op.col]: "Transaction.userId" },
                        },
                    },
                    {
                        model: TransactionPoints,
                        attributes: ["name", "email", "phone"],
                    },
                ],
                order: [["createdAt", "DESC"]], // Mengurutkan berdasarkan createdAt dari yang terbaru
                limit: 3, // Batasan jumlah transaksi yang akan ditampilkan
            });
            res.status(200).json({
                status: "success",
                message: "get transaction by buyer success",
                data,
            });
        }
    },

    async updateTransaction(req, res) {
        try {
            const id = req.params.id;
            const { buyer, date, quantity, note, address, email, phone } =
                req.body;

            const transaction = await Transaction.findOne({
                where: { id },
            });

            const productId = transaction.productId;

            // Temukan produk yang terkait dengan transaksi
            const product = await Product.findOne({
                where: {
                    id: productId,
                },
            });

            // Hitung selisih antara quantity baru dan quantity lama
            const quantityDifference = quantity - transaction.quantity;

            // Perbarui stok produk
            product.stok -= quantityDifference;

            const additionalAmount = product.price * quantityDifference;

            const newAmount = transaction.amount + additionalAmount;

            const pointsUser = await TransactionPoints.findOne({
                where: {
                    phone: transaction.phone,
                },
            });

            // hitung selisih point lama dan baru
            const pointDeference = product.point * quantity;

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

                        // Update detail transaksi
                        transaction.buyer = buyer;
                        transaction.date = date;
                        transaction.quantity = quantity;
                        transaction.note = note;
                        transaction.address = address;
                        transaction.image = result.url;
                        transaction.amount = newAmount;

                        // update point buyer
                        pointsUser.points_balance = pointDeference;
                        pointsUser.email = email;
                        pointsUser.phone = phone;

                        await transaction.save();

                        await product.save();

                        await pointsUser.save();

                        res.status(200).json({
                            status: "success",
                            message: "update transaction successfully",
                            data: transaction,
                        });
                    }
                );
            } else {
                // Update detail transaksi
                transaction.buyer = buyer;
                transaction.date = date;
                transaction.quantity = quantity;
                transaction.note = note;
                transaction.address = address;
                transaction.amount = newAmount;

                // update point buyer
                pointsUser.points_balance = pointDeference;
                pointsUser.email = email;
                pointsUser.phone = phone;

                await transaction.save();

                await product.save();

                await pointsUser.save();

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

            const productId = transaction.productId;

            const product = await Product.findOne({
                where: {
                    id: productId,
                },
            });

            // Perbarui stok produk
            product.stok += transaction.quantity;

            const pointUser = await TransactionPoints.findOne({
                where: {
                    transactionId: transaction.id,
                },
            });

            // // Simpan perubahan stok produk
            // await product.save();

            if (transaction) {
                await product.save();
                await transaction.destroy();
                if (pointUser) {
                    await pointUser.destroy();
                }

                res.status(200).json({
                    status: "success",
                    message: "transaction data deleted successfully",
                });
            }

            // transaction.destroy().then(() => {
            //     res.status(200).json({
            //         status: "success",
            //         message: "transaction data deleted successfully",
            //     });
            // });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },
};
