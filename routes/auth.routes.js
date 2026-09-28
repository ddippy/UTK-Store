const router = require("express").Router();
const authController = require("../controllers/auth.controller");

// Admin Login
router.get("/admin/login", 
    authController.adminLoginForm);
router.post("/admin/login", 
    authController.adminLogin);

// User Login
router.get("/user/login", 
    authController.userLoginForm);

router.get("/user/register",
    authController.userRegisterForm);

router.post("/user/login", 
    authController.userLogin);

// Logout
router.post("/logout",
    authController.logout);

module.exports = router;
