const Permission = require("../models/permission.model");
const ActivityLog = require("../models/activityLog.model");

const authorizeRoute = async (req, res, next) => {
    res.set("Cache-Control", "no-store");

    // Admin accounts are separate and retain full access, including new features.
    if (req.session.adminId) return next();

    if (req.baseUrl === "/admin" || req.originalUrl.startsWith("/admin/")) {
        const returnTo = encodeURIComponent(req.originalUrl || "/admin/");
        return res.redirect(`/admin/login?returnTo=${returnTo}`);
    }

    if (!req.session.userId) {
        const returnTo = encodeURIComponent(req.originalUrl || "/");
        await ActivityLog.record(req, {
            eventType: req.path.includes("payment-slip") ? "file.access" : "access.denied",
            resourceType: req.path.includes("payment-slip") ? "payment_slip" : "route",
            resourceId: req.path,
            outcome: "denied",
            details: { reason: "authentication_required" },
        });
        return res.redirect(`/user/login?returnTo=${returnTo}`);
    }

    try {
        const routePath = `${req.baseUrl}${req.route.path === "/" ? "" : req.route.path}`;
        const allowed = await Permission.userHasPermissionForRoute(
            req.session.userId,
            req.method,
            routePath,
        );
        if (!allowed) {
            const isSlipUpload = req.method === "POST" && routePath === "/orders/create";
            const isFileRoute = routePath.includes("payment-slip") || isSlipUpload;
            await ActivityLog.record(req, {
                eventType: isSlipUpload ? "file.upload" : isFileRoute ? "file.access" : "access.denied",
                resourceType: isFileRoute ? "payment_slip" : "route",
                resourceId: routePath,
                outcome: "denied",
                details: { reason: "permission_denied" },
            });
            return res.status(403).send("คุณไม่มีสิทธิ์ใช้งานส่วนนี้");
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = authorizeRoute;
