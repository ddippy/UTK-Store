const bcrypt = require("bcrypt");
const Admin = require("../models/admin.model");
const User = require("../models/user.model");
const ActivityLog = require("../models/activityLog.model");

// ==================== ADMIN ====================
const getAdminReturnTo = (value) =>
    typeof value === "string" && value.startsWith("/admin/") && !value.startsWith("//")
        ? value
        : "/admin/";

exports.adminLoginForm = (req, res) => {
    const returnTo = getAdminReturnTo(req.query.returnTo);

    res.render("auth/admin-login", {
        returnTo,
        error: null,
    });
};

exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;

    const returnTo = getAdminReturnTo(req.body.returnTo);

    if (!username || !password) {
        await ActivityLog.record(req, {
            actorType: "admin",
            actorUserId: null,
            actorAdminId: null,
            actorUsername: username,
            actorRole: "ADMIN",
            eventType: "auth.login",
            resourceType: "authentication",
            outcome: "failure",
            details: { accountType: "admin", reason: "missing_credentials" },
        });
        return res.status(400).render("auth/admin-login", {
            error: "กรุณากรอกอีเมลและรหัสผ่าน",
            returnTo,
        });
    }

    const admin = await Admin.findByUsername(username);

    if (!admin) {
        await ActivityLog.record(req, {
            actorType: "admin",
            actorUserId: null,
            actorAdminId: null,
            actorUsername: username,
            actorRole: "ADMIN",
            eventType: "auth.login",
            resourceType: "authentication",
            outcome: "failure",
            details: { accountType: "admin", reason: "invalid_credentials" },
        });
        return res.status(401).render("auth/admin-login", {
            error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
            returnTo,
        });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
        await ActivityLog.record(req, {
            actorType: "admin",
            actorUserId: null,
            actorAdminId: null,
            actorUsername: username,
            actorRole: "ADMIN",
            eventType: "auth.login",
            resourceType: "authentication",
            outcome: "failure",
            details: { accountType: "admin", reason: "invalid_credentials" },
        });
        return res.status(401).render("auth/admin-login", {
            error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
            returnTo,
        });
    }

    req.session.adminId = admin.admin_id;
    req.session.adminUsername = admin.username;
    req.session.role = admin.role;

    await ActivityLog.record(req, {
        actorType: "admin",
        actorAdminId: admin.admin_id,
        actorUserId: null,
        actorUsername: admin.username,
        eventType: "auth.login",
        resourceType: "authentication",
        outcome: "success",
        details: { accountType: "admin" },
    });

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
    const wantsJson = req.headers.accept && req.headers.accept.includes("application/json");

    const { username, password } = req.body;
    const returnTo = req.body.returnTo || "/";

    // กรอกไม่ครบ
    if (!username || !password) {
        await ActivityLog.record(req, {
            actorType: "user",
            actorUserId: null,
            actorAdminId: null,
            actorUsername: username,
            actorRole: null,
            eventType: "auth.login",
            resourceType: "authentication",
            outcome: "failure",
            details: { accountType: "user", reason: "missing_credentials" },
        });
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
        await ActivityLog.record(req, {
            actorType: "user",
            actorUserId: null,
            actorAdminId: null,
            actorUsername: username,
            actorRole: null,
            eventType: "auth.login",
            resourceType: "authentication",
            outcome: "failure",
            details: { accountType: "user", reason: "invalid_credentials" },
        });
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
        await ActivityLog.record(req, {
            actorType: "user",
            actorUserId: null,
            actorAdminId: null,
            actorUsername: username,
            actorRole: null,
            eventType: "auth.login",
            resourceType: "authentication",
            outcome: "failure",
            details: { accountType: "user", reason: "invalid_credentials" },
        });
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
    req.session.role = user.role || "USER";

    await ActivityLog.record(req, {
        actorType: "user",
        actorUserId: user.user_id,
        actorAdminId: null,
        actorUsername: user.username,
        eventType: "auth.login",
        resourceType: "authentication",
        outcome: "success",
        details: { accountType: "user" },
    });

    if (wantsJson) {
        return res.json({
            redirect: returnTo,
        });
    }

    res.redirect(returnTo);
};

// ==================== LOGOUT ====================
exports.logout = async (req, res) => {
    const actor = {
        actorType: req.session.adminId ? "admin" : "user",
        actorUserId: req.session.userId || null,
        actorAdminId: req.session.adminId || null,
        actorUsername: req.session.adminUsername || req.session.username || "anonymous",
        actorRole: req.session.role || (req.session.adminId ? "ADMIN" : null),
    };

    req.session.destroy(async (error) => {
        if (error) {
            console.error(error);
            await ActivityLog.record(req, {
                ...actor,
                eventType: "auth.logout",
                resourceType: "authentication",
                outcome: "failure",
                details: { reason: "session_destroy_failed" },
            });
            return res.status(500).send("เกิดข้อผิดพลาดในการ Logout");
        }

        await ActivityLog.record(req, {
            ...actor,
            eventType: "auth.logout",
            resourceType: "authentication",
            outcome: "success",
        });
        res.redirect("/user/login");
    });
};

// ==================== USER REGISTER ====================
exports.userRegister = async (req, res) => {
    const renderRegisterError = (res, status, error) =>
        res.status(status).render("auth/user-register", { error });

    try {
        const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const student_id =
            typeof req.body.student_id === "string" ? req.body.student_id.trim() : "";
        const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";

        // 1. ตรวจสอบว่ากรอกข้อมูลครบทุกช่องหรือไม่
        if (!username || !password || !name || !student_id || !phone) {
            return renderRegisterError(res, 400, "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง");
        }

        if (username.length > 50) {
            return renderRegisterError(res, 400, "Username ต้องไม่เกิน 50 ตัวอักษร");
        }
        if (name.length > 150) {
            return renderRegisterError(res, 400, "ชื่อต้องไม่เกิน 150 ตัวอักษร");
        }
        if (student_id.length > 30) {
            return renderRegisterError(res, 400, "รหัสนักศึกษาต้องไม่เกิน 30 ตัวอักษร");
        }
        if (phone.length > 20) {
            return renderRegisterError(res, 400, "เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร");
        }
        if (Buffer.byteLength(password, "utf8") > 72) {
            return renderRegisterError(res, 400, "รหัสผ่านยาวเกินไป กรุณาใช้ไม่เกิน 72 ไบต์");
        }

        // 2. ตรวจสอบ Username ซ้ำในระบบ
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return renderRegisterError(res, 400, "Username นี้ถูกใช้งานแล้ว กรุณาใช้ Username อื่น");
        }

        // 3. ตรวจสอบ รหัสนักศึกษา ซ้ำในระบบ
        const existingStudent = await User.findByStudentId(student_id);
        if (existingStudent) {
            return renderRegisterError(res, 400, "รหัสนักศึกษานี้ถูกใช้งานในระบบแล้ว");
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

        await ActivityLog.record(req, {
            actorType: "user",
            actorUserId: newUser.user_id,
            actorAdminId: null,
            actorUsername: newUser.username,
            eventType: "user.register",
            resourceType: "user",
            resourceId: newUser.user_id,
            outcome: "success",
        });

        // 7. สมัครเสร็จแล้วส่งกลับไปหน้าหลัก (Home)
        res.redirect("/");
    } catch (error) {
        console.error("User Registration Error:", error);
        if (error.code === "23505" && error.constraint === "users_username_key") {
            return renderRegisterError(res, 400, "Username นี้ถูกใช้งานแล้ว กรุณาใช้ Username อื่น");
        }
        if (error.code === "23505" && error.constraint === "users_student_id_key") {
            return renderRegisterError(res, 400, "รหัสนักศึกษานี้ถูกใช้งานในระบบแล้ว");
        }
        if (error.code === "22001") {
            return renderRegisterError(res, 400, "ข้อมูลบางช่องยาวเกินกำหนด กรุณาตรวจสอบอีกครั้ง");
        }
        renderRegisterError(res, 500, "เกิดข้อผิดพลาดของระบบ กรุณาตรวจสอบ Terminal ที่รันเว็บ");
    }
};
