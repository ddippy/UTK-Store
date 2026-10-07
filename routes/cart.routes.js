const router = require("express").Router();
const cartController = require("../controllers/cart.controller");
const requireUser = require("../middleware/userAuth");
const authorizeRoute = require("../middleware/permissionAuth");

router.post("/add",
    requireUser(req => req.body.returnTo),
    authorizeRoute,
    cartController.add
);

router.post("/remove", requireUser("/cart"), authorizeRoute, cartController.remove);

router.post("/update", requireUser("/cart"), authorizeRoute, cartController.update);

router.get("/", authorizeRoute, cartController.list);

module.exports = router;
