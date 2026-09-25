const router = require("express").Router();

const orderController = require("../controllers/order.controller");
const requireUser = require("../middleware/userAuth");

router.get(
  "/checkout",
  requireUser("/orders/checkout"),
  orderController.checkout,
);

router.post("/create", orderController.create);

router.get("/:id", orderController.detail);

module.exports = router;
