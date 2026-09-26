const userInfo = (req, res, next) => {
    res.locals.userName = req.session.userName || null;
    res.locals.role = req.session.role || null;
    res.locals.currentPath = req.path;

    const cart = req.session.cart || [];

    res.locals.cartCount = cart.reduce((total, item) => {
        return total + Number(item.quantity);
    }, 0);
    
    next();
};

module.exports = userInfo;