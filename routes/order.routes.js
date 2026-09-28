const router = require("express").Router();

const orderController = require("../controllers/order.controller");
const requireUser = require("../middleware/userAuth");
const upload = require("../middleware/paymentUpload"); // Multer สำหรับรับสลิปการชำระเงิน

router.get(
  "/checkout",
  requireUser("/orders/checkout"),
  orderController.checkout,
);

router.get("/:id", orderController.detail);

// รับไฟล์ชื่อ payment_slip ก่อนเข้า Controller
router.post(
  "/create",
  upload.single("payment_slip"),
  orderController.create
);



module.exports = router;
