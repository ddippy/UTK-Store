const router = require("express").Router();
const cartController = require("../controllers/cart.controller");
const requireUser = require("../middleware/userAuth");

router.post("/add",
    requireUser(req => req.body.returnTo),
    cartController.add
);

router.post("/remove", cartController.remove);

router.post("/update", cartController.update);

router.get("/", cartController.list);

module.exports = router;
