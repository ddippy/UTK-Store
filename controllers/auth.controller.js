const bcrypt = require("bcrypt");
const Admin = require("../models/admin.model");

exports.loginForm = (req, res) => {
  res.render("auth/login");
};

exports.login = async (req, res) => {
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

  res.redirect("/admin");
};

exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error(error);
      return res.status(500).send("เกิดข้อผิดพลาดในการ Logout");
    }

    res.redirect("/login");
  });
};
