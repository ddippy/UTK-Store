const Role = require("../models/role.model");
const User = require("../models/user.model");
const ActivityLog = require("../models/activityLog.model");

const parseId = (value) => /^\d+$/.test(String(value));

const validateRole = ({ name, description }) => {
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanDescription = typeof description === "string" ? description.trim() : "";

    if (cleanName.length < 2 || cleanName.length > 50) {
        return { error: "ชื่อ Role ต้องมีความยาว 2–50 ตัวอักษร" };
    }

    if (cleanName.toUpperCase() === "ADMIN") {
        return { error: "ชื่อ ADMIN สงวนไว้สำหรับบัญชีผู้ดูแลระบบ" };
    }

    if (cleanDescription.length > 500) {
        return { error: "คำอธิบายต้องมีความยาวไม่เกิน 500 ตัวอักษร" };
    }

    return { name: cleanName, description: cleanDescription };
};

exports.roles = async (req, res) => {
    const roles = await Role.findAll();
    res.render("admin/roles", { roles, message: req.query.message || null });
};

exports.createRole = async (req, res) => {
    const value = validateRole(req.body);
    if (value.error) return res.status(400).send(value.error);

    try {
        await Role.create(value.name, value.description);
        await ActivityLog.record(req, {
            eventType: "role.create",
            resourceType: "role",
            resourceId: value.name,
            details: { roleName: value.name },
        });
        res.redirect("/admin/roles?message=created");
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).send("มี Role ชื่อนี้อยู่แล้ว");
        }
        console.error(error);
        res.status(500).send("เพิ่ม Role ไม่สำเร็จ");
    }
};

exports.updateRole = async (req, res) => {
    if (!parseId(req.params.id)) return res.status(400).send("Role ID ไม่ถูกต้อง");

    const value = validateRole(req.body);
    if (value.error) return res.status(400).send(value.error);

    try {
        const updated = await Role.updateCustom(req.params.id, value.name, value.description);
        if (!updated) return res.status(403).send("Role เริ่มต้นไม่สามารถแก้ชื่อได้");
        await ActivityLog.record(req, {
            eventType: "role.update",
            resourceType: "role",
            resourceId: req.params.id,
            details: { roleName: value.name },
        });
        res.redirect("/admin/roles?message=updated");
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).send("มี Role ชื่อนี้อยู่แล้ว");
        }
        console.error(error);
        res.status(500).send("แก้ไข Role ไม่สำเร็จ");
    }
};

exports.deleteRole = async (req, res) => {
    if (!parseId(req.params.id)) return res.status(400).send("Role ID ไม่ถูกต้อง");

    try {
        const deleted = await Role.deleteUnassignedCustom(req.params.id);
        if (!deleted) {
            return res.status(409).send("ลบไม่ได้: Role เริ่มต้นหรือยังมีบัญชีใช้งานอยู่");
        }
        await ActivityLog.record(req, {
            eventType: "role.delete",
            resourceType: "role",
            resourceId: req.params.id,
        });
        res.redirect("/admin/roles?message=deleted");
    } catch (error) {
        console.error(error);
        res.status(500).send("ลบ Role ไม่สำเร็จ");
    }
};

exports.users = async (req, res) => {
    const [users, roles] = await Promise.all([
        User.findAllForAdmin(),
        Role.findAssignableToUsers(),
    ]);
    res.render("admin/users", { users, roles, message: req.query.message || null });
};

exports.updateUserRole = async (req, res) => {
    if (!parseId(req.params.id) || !parseId(req.body.role_id)) {
        return res.status(400).send("ข้อมูลบัญชีหรือ Role ไม่ถูกต้อง");
    }

    try {
        const updated = await User.updateRole(req.params.id, req.body.role_id);
        if (!updated) {
            return res.status(400).send("ไม่พบผู้ใช้หรือ Role ที่เลือกไม่สามารถกำหนดได้");
        }
        await ActivityLog.record(req, {
            eventType: "user.role.update",
            resourceType: "user",
            resourceId: req.params.id,
            details: { newRoleId: Number(req.body.role_id) },
        });
        res.redirect("/admin/users?message=updated");
    } catch (error) {
        console.error(error);
        res.status(500).send("เปลี่ยน Role ผู้ใช้ไม่สำเร็จ");
    }
};
