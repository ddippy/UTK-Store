const userInfo = (req, res, next) => {
    res.locals.userName = req.session.userName || null;
    res.locals.role = req.session.role || null;
    res.locals.isUserLoggedIn = Boolean(req.session.userId);
    res.locals.currentPath = req.path;
    res.locals.adminNavUsername = req.session.adminUsername || req.session.username || "ผู้ดูแลระบบ";
    res.locals.adminNavRole = req.session.role || (req.session.adminId ? "ADMIN" : "USER");

    const cart = req.session.cart || [];

    res.locals.cartCount = cart.reduce((total, item) => {
        return total + Number(item.quantity);
    }, 0);

    next();
};

module.exports = userInfo;
