const bcrypt = require("bcrypt");
const Admin = require("../models/admin.model");
const User = require("../models/user.model");

// ==================== ADMIN ====================
exports.adminLoginForm = (req, res) => {
  res.render("auth/admin-login");
};

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("กรุณากรอก Username และ Password");
  }

  const admin = await Admin.findByUsername(username);

  if (!admin) {
    return res.status(401).send("Username หรือ Password ไม่ถูกต้อง");
  }

  const isMatch = await bcrypt.compare(password, admin.password_hash);

  if (!isMatch) {
    return res.status(401).send("Username หรือ Password ไม่ถูกต้อง");
  }

  req.session.adminId = admin.admin_id;
  req.session.adminUsername = admin.username;
  req.session.userName = admin.username;
  req.session.role = "ADMIN";

  res.redirect("/admin");
};

// ==================== USER ====================

exports.userLoginForm = (req, res) => {
  const { returnTo } = req.query;

  res.render("auth/user-login", { returnTo });
};

exports.userLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("กรุณากรอก Username และ Password");
  }

  const user = await User.findByUsername(username);

  if (!user) {
    return res.status(401).send("Username หรือ Password ไม่ถูกต้อง");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).send("Username หรือ Password ไม่ถูกต้อง");
  }

  req.session.userId = user.user_id;
  req.session.username = user.username;
  req.session.userName = user.name;
  req.session.role = "USER";

  const returnTo = req.body.returnTo || "/";

  res.redirect(returnTo);
};

// ==================== LOGOUT ====================
exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error(error);
      return res.status(500).send("เกิดข้อผิดพลาดในการ Logout");
    }

    res.redirect("/user/login");
  });
};
