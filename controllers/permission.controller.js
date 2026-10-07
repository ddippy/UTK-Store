const Permission = require("../models/permission.model");
const Role = require("../models/role.model");
const ActivityLog = require("../models/activityLog.model");

const parseId = (value) => /^\d+$/.test(String(value));

const validatePermission = (body) => {
    const name = typeof body.name === "string" ? body.name.trim().toLowerCase() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const target = Permission.functionCatalog.find(
        (item) => `${item.method} ${item.path}` === body.route_target,
    );

    if (!/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(name) || name.length > 100) {
        return { error: "Permission ต้องเป็นตัวพิมพ์เล็ก เช่น inventory.update" };
    }
    if (description.length > 255) {
        return { error: "คำอธิบายต้องมีความยาวไม่เกิน 255 ตัวอักษร" };
    }
    if (!target) return { error: "กรุณาเลือกฟังก์ชันที่ Permission นี้จะควบคุม" };

    return { name, description, target };
};

exports.permissions = async (req, res) => {
    const permissions = await Permission.findAll();
    res.render("admin/permissions", {
        permissions,
        functionCatalog: Permission.functionCatalog,
        message: req.query.message || null,
    });
};

exports.create = async (req, res) => {
    const value = validatePermission(req.body);
    if (value.error) return res.status(400).send(value.error);

    try {
        await Permission.create(
            value.name,
            value.description,
            value.target.method,
            value.target.path,
        );
        await ActivityLog.record(req, {
            eventType: "permission.create",
            resourceType: "permission",
            resourceId: value.name,
            details: {
                permissionName: value.name,
                route: `${value.target.method} ${value.target.path}`,
            },
        });
        res.redirect("/admin/permissions?message=created");
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).send("มี Permission ชื่อนี้อยู่แล้ว");
        }
        console.error(error);
        res.status(500).send("เพิ่ม Permission ไม่สำเร็จ");
    }
};

exports.update = async (req, res) => {
    if (!parseId(req.params.id)) return res.status(400).send("Permission ID ไม่ถูกต้อง");
    const value = validatePermission(req.body);
    if (value.error) return res.status(400).send(value.error);

    try {
        const updated = await Permission.update(
            req.params.id,
            value.name,
            value.description,
            value.target.method,
            value.target.path,
        );
        if (!updated) {
            return res.status(403).send("Permission เริ่มต้นของระบบแก้ไขไม่ได้");
        }
        await ActivityLog.record(req, {
            eventType: "permission.update",
            resourceType: "permission",
            resourceId: req.params.id,
            details: {
                permissionName: value.name,
                route: `${value.target.method} ${value.target.path}`,
            },
        });
        res.redirect("/admin/permissions?message=updated");
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).send("มี Permission ชื่อนี้อยู่แล้ว");
        }
        console.error(error);
        res.status(500).send("แก้ไข Permission ไม่สำเร็จ");
    }
};

exports.remove = async (req, res) => {
    if (!parseId(req.params.id)) return res.status(400).send("Permission ID ไม่ถูกต้อง");

    try {
        const deleted = await Permission.deleteCustom(req.params.id);
        if (!deleted) {
            return res.status(403).send("Permission เริ่มต้นของระบบลบไม่ได้");
        }
        await ActivityLog.record(req, {
            eventType: "permission.delete",
            resourceType: "permission",
            resourceId: req.params.id,
        });
        res.redirect("/admin/permissions?message=deleted");
    } catch (error) {
        console.error(error);
        res.status(500).send("ลบ Permission ไม่สำเร็จ");
    }
};

exports.acl = async (req, res) => {
    const [roles, permissions, rows] = await Promise.all([
        Role.findAll(),
        Permission.findAll(),
        Permission.findAllWithAcl(),
    ]);
    const assignments = {};
    for (const row of rows) {
        assignments[row.role_id] ||= {};
        assignments[row.role_id][row.permission_id] = row.assigned;
    }

    res.render("admin/acl", {
        roles,
        permissions,
        assignments,
        message: req.query.message || null,
    });
};

exports.setAcl = async (req, res) => {
    if (!parseId(req.params.roleId) || !parseId(req.params.permissionId)) {
        return res.status(400).send("Role หรือ Permission ID ไม่ถูกต้อง");
    }
    if (!["0", "1"].includes(String(req.body.enabled))) {
        return res.status(400).send("สถานะ Permission ไม่ถูกต้อง");
    }

    try {
        const changed = await Permission.setRolePermission(
            req.params.roleId,
            req.params.permissionId,
            req.body.enabled === "1",
        );
        if (!changed) {
            return res.status(403).send("Role ADMIN สงวนสิทธิ์ทั้งหมด หรือไม่พบรายการที่ระบุ");
        }
        await ActivityLog.record(req, {
            eventType: "acl.update",
            resourceType: "role_permission",
            resourceId: `${req.params.roleId}:${req.params.permissionId}`,
            details: {
                roleId: Number(req.params.roleId),
                permissionId: Number(req.params.permissionId),
                enabled: req.body.enabled === "1",
            },
        });
        res.redirect("/admin/acl?message=updated");
    } catch (error) {
        console.error(error);
        res.status(500).send("บันทึก ACL ไม่สำเร็จ");
    }
};
