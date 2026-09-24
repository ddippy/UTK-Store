const router = require("express").Router();
const productController = require("../controllers/product.controller");

router.get("/", productController.list);
router.get("/:id", productController.detail);

module.exports = router;