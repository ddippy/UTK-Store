const Permission = require("../models/permission.model");

const authorizeRoute = async (req, res, next) => {
    res.set("Cache-Control", "no-store");

    // Admin accounts are separate and retain full access, including new features.
    if (req.session.adminId) return next();

    if (!req.session.userId) {
      const returnTo = encodeURIComponent(req.originalUrl || "/");
      return res.redirect(`/user/login?returnTo=${returnTo}`);
    }

    try {
      const routePath = `${req.baseUrl}${req.route.path === "/" ? "" : req.route.path}`;
      const allowed = await Permission.userHasPermissionForRoute(
        req.session.userId,
        req.method,
        routePath,
      );
      if (!allowed) return res.status(403).send("คุณไม่มีสิทธิ์ใช้งานส่วนนี้");
      next();
    } catch (error) {
      next(error);
    }
};

module.exports = authorizeRoute;
