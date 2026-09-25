const requireAdmin = (req, res, next) => {
  res.set("Cache-Control", "no-store");

  if (!req.session.adminId) {
    return res.redirect("/admin/login");
  }

  next();
};

module.exports = requireAdmin;
