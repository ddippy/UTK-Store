const Permission = require("../models/permission.model");
const ActivityLog = require("../models/activityLog.model");

const authorizeRoute = async (req, res, next) => {
    res.set("Cache-Control", "no-store");

    // Admin accounts are separate and retain full access, including new features.
    if (req.session.adminId) return next();

    if (!req.session.userId) {
        if (req.baseUrl === "/admin" || req.originalUrl.startsWith("/admin/")) {
            const returnTo = encodeURIComponent(req.originalUrl || "/admin/");
            return res.redirect(`/admin/login?returnTo=${returnTo}`);
        }

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

            const acceptHeader = req.get("accept") || "";
            const isFetchRequest =
                req.get("sec-fetch-mode") === "cors" ||
                req.get("x-requested-with") === "XMLHttpRequest" ||
                !/\btext\/html\b/i.test(acceptHeader);

            // Existing fetch handlers display this response inside the app toast.
            if (isFetchRequest) {
                return res.status(403).type("text/plain").send("คุณไม่มีสิทธิ์ใช้งานส่วนนี้");
            }

            const referer = req.get("referer");
            const requestedPath = new URL(req.originalUrl, "http://localhost").pathname;
            let returnTo = "/";
            if (referer) {
                try {
                    const refererUrl = new URL(referer);
                    if (refererUrl.host === req.get("host") && refererUrl.pathname !== requestedPath) {
                        returnTo = `${refererUrl.pathname}${refererUrl.search}${refererUrl.hash}`;
                    }
                } catch {
                    // ใช้หน้าแรกเป็น fallback หาก Referer ไม่ใช่ URL ที่ถูกต้อง
                }
            }

            const redirectUrl = new URL(returnTo, "http://localhost");
            redirectUrl.searchParams.set("access", "denied");
            return res.redirect(redirectUrl.pathname + redirectUrl.search + redirectUrl.hash);
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = authorizeRoute;
