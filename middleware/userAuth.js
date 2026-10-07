const ActivityLog = require("../models/activityLog.model");

const requireUser = (getReturnTo) => {
    return async (req, res, next) => {
        res.set("Cache-Control", "no-store");

        if (!req.session.userId) {
            const requestPath = req.originalUrl?.split("?")[0] || req.path;
            const returnTo =
                typeof getReturnTo === "function" ? getReturnTo(req) : getReturnTo || "/";

            const isSlipUpload = requestPath === "/orders/create";
            await ActivityLog.record(req, {
                eventType: isSlipUpload ? "file.upload" : "access.denied",
                resourceType: isSlipUpload ? "payment_slip" : "route",
                resourceId: requestPath,
                outcome: "denied",
                details: { reason: "authentication_required" },
            });

            return res.redirect(`/user/login?returnTo=${encodeURIComponent(returnTo)}`);
        }

        next();
    };
};

module.exports = requireUser;
