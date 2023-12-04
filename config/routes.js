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
    getPointsByIdUser,
    getPointsByBuyer,
    getPointsByPhone,
    getPointsByQuery,
} = require("../app/controllers/pointController");
// const {
//     trainModel,
//     resultModelTrain,
// } = require("../app/controllers/predictController");
const {
    createProduct,
    getAllProduct,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("../app/controllers/productController");
const {
    createReward,
    getReward,
    getAvailableRewards,
    getRewardById,
    updateReward,
    deleteReward,
} = require("../app/controllers/rewardController");
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
    getTransactionByIdUser,
    getTransactionEmail,
} = require("../app/controllers/transactionController");
const {
    getAllUser,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getAllUserBySuperAdmin,
    updateUserWithToken,
} = require("../app/controllers/userController");
const { authorize } = require("../app/middleware/authorize");
const validator = require("../app/middleware/validation");

const router = require("express").Router();

router.get("/", handleRoot);

router.post("/register", register);

router.post("/register-admin", authorize, registerAdmin);

router.post("/add-user", authorize, createUser);

router.get("/all-user-karyawan", getAllUser);

router.get("/all-user", getAllUserBySuperAdmin);

router.get("/user/:id", authorize, getUserById);

router.put("/user/:id", authorize, updateUser);

router.put("/user", validator, authorize, updateUserWithToken);

router.delete("/user/:id", authorize, deleteUser);

router.put("/verify-user", verifyUser);

router.post("/resend-otp", resendOTP);

router.post("/login", login);

router.get("/whoami", authorize, whoami);

router.post("/forgot-password", forgotPass);

router.put("/reset-password", resetPass);

router.post("/product", validator, authorize, createProduct);

router.get("/product", getAllProduct);

router.get("/product/:id", getProductById);

router.put("/product/:id", validator, authorize, updateProduct);

router.delete("/product/:id", authorize, deleteProduct);

router.post("/transaction", validator, authorize, createTransaction);

router.get("/transaction/:id", authorize, getTransactionById);

router.get("/transactionByIdUser/:id", authorize, getTransactionByIdUser);

router.get("/transaction-address", authorize, getTransactionByAddress);

router.post("/transaction-email", authorize, getTransactionEmail);

// router.get("/transaction", authorize, getAllTransactionEmployee);

router.get("/transaction", authorize, getTransactionByQuery);

router.get("/transaction-new", authorize, getAllNewTransaction);

router.get("/all-transaction", authorize, getAllTransaction);

router.put("/transaction/:id", validator, authorize, updateTransaction);

router.delete("/transaction/:id", authorize, deleteTransaction);

router.get("/pointsIdUser", authorize, getPointsByIdUser);

router.get("/pointsBuyer", authorize, getPointsByBuyer);

router.get("/pointsByPhone", authorize, getPointsByPhone);

router.get("/pointsByQuery", authorize, getPointsByQuery);

router.post("/reward", authorize, createReward);

router.get("/reward", authorize, getReward);

router.get("/rewardbypoin", authorize, getAvailableRewards);

router.get("/reward/:id", getRewardById);

router.put("/reward/:id", authorize, updateReward);

router.delete("/reward/:id", authorize, deleteReward);

router.post("/information", authorize, createInformation);

router.get("/information", getAllInformation);

router.get("/information/:id", getInformationByID);

router.put("/information/:id", authorize, updateInformation);

router.delete("/information/:id", authorize, deleteInformation);

// router.get("/train-model", authorize, trainModel);

module.exports = router;
