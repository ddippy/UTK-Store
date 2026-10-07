const bcrypt = require("bcrypt");
const Admin = require("../models/admin.model");
const User = require("../models/user.model");

// ==================== ADMIN ====================
exports.adminLoginForm = (req, res) => {
  const { returnTo } = req.query;

  res.render("auth/admin-login", {
    returnTo,
    error: null,
  });
};

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  const returnTo = req.body.returnTo || "/";

  if (!username || !password) {
    return res.status(400).render("auth/admin-login", {
      error: "กรุณากรอกอีเมลและรหัสผ่าน",
      returnTo,
    });
  }

  const admin = await Admin.findByUsername(username);

  if (!admin) {
    return res.status(401).render("auth/admin-login", {
      error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      returnTo,
    });
  }

  const isMatch = await bcrypt.compare(password, admin.password_hash);

  if (!isMatch) {
    return res.status(401).render("auth/admin-login", {
      error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      returnTo,
    });
  }

  req.session.userId = Admin.user_id;
  req.session.username = Admin.username;
  req.session.userName = Admin.name;
  req.session.role = "ADMIN";

  res.redirect(returnTo);
};

// ==================== USER ====================
exports.userRegisterForm = (req, res) => {
  res.render("auth/user-register", {
    error: null,
  });
};

exports.userLoginForm = (req, res) => {
  const { returnTo } = req.query;

  res.render("auth/user-login", {
    returnTo,
    error: null,
  });
};

exports.userLogin = async (req, res) => {
  const wantsJson =
    req.headers.accept && req.headers.accept.includes("application/json");

  const { username, password } = req.body;
  const returnTo = req.body.returnTo || "/";

  // กรอกไม่ครบ
  if (!username || !password) {
    if (wantsJson) {
      return res.status(400).json({
        error: "กรุณากรอก Username และ Password",
      });
    }

    return res.status(400).render("auth/user-login", {
      error: "กรุณากรอก Username และ Password",
      returnTo,
    });
  }

  // ค้นหา User
  const user = await User.findByUsername(username);

  // ไม่พบ User
  if (!user) {
    if (wantsJson) {
      return res.status(401).json({
        error: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    return res.status(401).render("auth/user-login", {
      error: "Username หรือ Password ไม่ถูกต้อง",
      returnTo,
    });
  }

  // ตรวจ Password
  const isMatch = await bcrypt.compare(password, user.password_hash);

  // Password ผิด
  if (!isMatch) {
    if (wantsJson) {
      return res.status(401).json({
        error: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    return res.status(401).render("auth/user-login", {
      error: "Username หรือ Password ไม่ถูกต้อง",
      returnTo,
    });
  }

  // Login สำเร็จ
  req.session.userId = user.user_id;
  req.session.username = user.username;
  req.session.userName = user.name;
  req.session.role = "USER";

  if (wantsJson) {
    return res.json({
      redirect: returnTo,
    });
  }

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


// ==================== USER REGISTER ====================
exports.userRegister = async (req, res) => {
  try {
    const { username, password, name, student_id, phone } = req.body;

    // 1. ตรวจสอบว่ากรอกข้อมูลครบทุกช่องหรือไม่
    if (!username || !password || !name || !student_id || !phone) {
      return res.status(400).render("auth/user-register", {
        error: "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง",
      });
    }

    // 2. ตรวจสอบ Username ซ้ำในระบบ
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).render("auth/user-register", {
        error: "Username นี้ถูกใช้งานแล้ว กรุณาใช้ Username อื่น",
      });
    }

    // 3. ตรวจสอบ รหัสนักศึกษา ซ้ำในระบบ
    const existingStudent = await User.findByStudentId(student_id);
    if (existingStudent) {
      return res.status(400).render("auth/user-register", {
        error: "รหัสนักศึกษานี้ถูกใช้งานในระบบแล้ว",
      });
    }

    // 4. Hash Password ด้วย bcrypt ก่อนบันทึก
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 5. บันทึกข้อมูลลงฐานข้อมูลผ่าน Model
    const newUser = await User.create({
      username,
      password_hash,
      name,
      student_id,
      phone,
      role: "USER",
    });

    // 6. Auto Login: บันทึกข้อมูลลง Session ทันที
    req.session.userId = newUser.user_id;
    req.session.username = newUser.username;
    req.session.userName = newUser.name;
    req.session.role = newUser.role;

    // 7. สมัครเสร็จแล้วส่งกลับไปหน้าหลัก (Home)
    res.redirect("/");
  } catch (error) {
    console.error("User Registration Error:", error);
    res.status(500).render("auth/user-register", {
      error: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง",
    });
  }
};
