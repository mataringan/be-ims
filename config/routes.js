const {
    register,
    verifyUser,
    login,
    whoami,
    resendOTP,
    registerAdmin,
} = require("../app/controllers/authController");
const {
    forgotPass,
    resetPass,
} = require("../app/controllers/forgotPasswordController");
const {
    createInformation,
    getAllInformation,
    getInformationByID,
    updateInformation,
    deleteInformation,
} = require("../app/controllers/informationController");
const {
    createProduct,
    getAllProduct,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("../app/controllers/productController");
const handleRoot = require("../app/controllers/root");
const {
    createTransaction,
    getAllTransactionEmployee,
    getAllTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getTransactionByQuery,
    getTransactionByAddress,
    getAllNewTransaction,
    getAllNewTransactionAdmin,
} = require("../app/controllers/transactionController");
const { getAllUser } = require("../app/controllers/userController");
const { authorize } = require("../app/middleware/authorize");
const validator = require("../app/middleware/validation");

const router = require("express").Router();

router.get("/", handleRoot);

router.post("/register", register);

router.post("/register-admin", registerAdmin);

router.put("/verify-user", verifyUser);

router.post("/resend-otp", resendOTP);

router.post("/login", login);

router.get("/whoami", authorize, whoami);

router.get("/all-user-karyawan", getAllUser);

router.post("/forgot-password", forgotPass);

router.put("/reset-password", resetPass);

router.post("/product", validator, authorize, createProduct);

router.get("/product", getAllProduct);

router.get("/product/:id", getProductById);

router.put("/product/:id", validator, authorize, updateProduct);

router.delete("/product/:id", authorize, deleteProduct);

router.post("/transaction", validator, authorize, createTransaction);

router.get("/transaction/:id", authorize, getTransactionById);

router.get("/transaction-address", authorize, getTransactionByAddress);

// router.get("/transaction", authorize, getAllTransactionEmployee);

router.get("/transaction", authorize, getTransactionByQuery);

router.get("/transaction-new", authorize, getAllNewTransaction);

router.get("/all-transaction", authorize, getAllTransaction);

router.put("/transaction/:id", validator, authorize, updateTransaction);

router.delete("/transaction/:id", authorize, deleteTransaction);

router.post("/information", authorize, createInformation);

router.get("/information", getAllInformation);

router.get("/information/:id", getInformationByID);

router.put("/information/:id", authorize, updateInformation);

router.delete("/information/:id", authorize, deleteInformation);

module.exports = router;
