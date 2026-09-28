const bcrypt = require("bcrypt");
const Admin = require("../models/admin.model");
const User = require("../models/user.model");

// ==================== ADMIN ====================
exports.adminLoginForm = (req, res) => {

  const { returnTo } = req.query;

  res.render("auth/admin-login", {
    returnTo,
    error: null
  });

};

exports.adminLogin = async (req, res) => {

  const { username, password } = req.body;

  const returnTo = req.body.returnTo || "/";

  if (!username || !password) {
    return res.status(400).render("auth/admin-login", {
      error: "กรุณากรอกอีเมลและรหัสผ่าน",
      returnTo
    });
  }

  const admin = await Admin.findByUsername(username);

  if (!admin) {
    return res.status(401).render("auth/admin-login", {
      error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      returnTo
    });
  }

  const isMatch = await bcrypt.compare(
    password,
    admin.password_hash
  );

  if (!isMatch) {
    return res.status(401).render("auth/admin-login", {
      error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      returnTo
    });
  }

  req.session.userId = Admin.user_id;
  req.session.username = Admin.username;
  req.session.userName = Admin.name;
  req.session.role = "ADMIN";

  res.redirect(returnTo);
};







// ==================== USER ====================

exports.userLoginForm = (req, res) => {

  const { returnTo } = req.query;

  res.render("auth/user-login", {
    returnTo,
    error: null
  });

};

exports.userLogin = async (req, res) => {

  const { username, password } = req.body;

  const returnTo = req.body.returnTo || "/";

  if (!username || !password) {
    return res.status(400).render("auth/user-login", {
      error: "กรุณากรอกอีเมลและรหัสผ่าน",
      returnTo
    });
  }

  const user = await User.findByUsername(username);

  if (!user) {
    return res.status(401).render("auth/user-login", {
      error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      returnTo
    });
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isMatch) {
    return res.status(401).render("auth/user-login", {
      error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      returnTo
    });
  }

  req.session.userId = user.user_id;
  req.session.username = user.username;
  req.session.userName = user.name;
  req.session.role = "USER";

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
