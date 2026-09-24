const router = require("express").Router();

const orderController = require("../controllers/order.controller");

router.get("/checkout", (req, res) => {
    res.render("orders/checkout");
});

router.post("/create", orderController.create);

router.get("/:id", orderController.detail);

module.exports = router;