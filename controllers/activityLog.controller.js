const ActivityLog = require("../models/activityLog.model");

const eventLabels = {
    "auth.login": "เข้าสู่ระบบ",
    "auth.logout": "ออกจากระบบ",
    "user.register": "สมัครสมาชิก",
    "access.denied": "ถูกปฏิเสธการเข้าถึง",
    "file.upload": "อัปโหลดไฟล์",
    "file.delete": "ลบไฟล์",
    "file.access": "เข้าถึงไฟล์",
    "order.create": "สร้างคำสั่งซื้อ",
    "order.status": "เปลี่ยนสถานะคำสั่งซื้อ",
    "product.create": "เพิ่มสินค้า",
    "product.update": "แก้ไขสินค้า",
    "product.status": "เปลี่ยนสถานะสินค้า",
    "product.variant.create": "เพิ่ม Variant/Stock",
    "product.variant.update": "แก้ไข Variant/Stock",
    "product.variant.delete": "ลบ Variant",
    "role.create": "เพิ่ม Role",
    "role.update": "แก้ไข Role",
    "role.delete": "ลบ Role",
    "user.role.update": "เปลี่ยน Role ผู้ใช้",
    "permission.create": "เพิ่ม Permission",
    "permission.update": "แก้ไข Permission",
    "permission.delete": "ลบ Permission",
    "acl.update": "เปลี่ยนสิทธิ์ ACL",
};

const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

exports.index = async (req, res, next) => {
    try {
        const filters = {
            from: isValidDate(req.query.from) ? req.query.from : "",
            to: isValidDate(req.query.to) ? req.query.to : "",
            username: typeof req.query.username === "string" ? req.query.username.trim().slice(0, 100) : "",
            eventType: Object.hasOwn(eventLabels, req.query.eventType) ? req.query.eventType : "",
            outcome: ["success", "failure", "denied"].includes(req.query.outcome)
                ? req.query.outcome
                : "",
        };
        const pageSize = 50;
        const requestedPage = /^\d+$/.test(String(req.query.page || "1"))
            ? Number(req.query.page)
            : 1;
        const { rows, total, page } = await ActivityLog.findPage({
            filters,
            page: Math.max(1, requestedPage),
            pageSize,
        });
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        const makePageUrl = (targetPage) => {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value) params.set(key, value);
            }
            params.set("page", String(targetPage));
            return `/admin/logs?${params.toString()}`;
        };

        res.render("admin/activity-logs", {
            logs: rows,
            filters,
            eventLabels,
            page,
            pageCount,
            total,
            previousUrl: makePageUrl(Math.max(1, page - 1)),
            nextUrl: makePageUrl(Math.min(pageCount, page + 1)),
        });
    } catch (error) {
        next(error);
    }
};
