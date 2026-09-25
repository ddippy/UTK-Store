const requireUser = (getReturnTo) => {
  return (req, res, next) => {
    res.set("Cache-Control", "no-store");

    if (!req.session.userId) {
      const returnTo =
        typeof getReturnTo === "function"
          ? getReturnTo(req)
          : getReturnTo || "/";

      return res.redirect(
        `/user/login?returnTo=${encodeURIComponent(returnTo)}`,
      );
    }

    next();
  };
};

module.exports = requireUser;
