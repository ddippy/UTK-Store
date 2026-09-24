const router = require("express").Router();
const cartController = require("../controllers/cart.controller");

router.post("/add", cartController.add);

router.post("/remove", cartController.remove);

router.post("/update", cartController.update);

router.get("/", cartController.list);

module.exports = router;
