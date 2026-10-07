const router = require("express").Router();

const orderController = require("../controllers/order.controller");
const requireUser = require("../middleware/userAuth");
const authorizeRoute = require("../middleware/permissionAuth");
const upload = require("../middleware/paymentUpload"); // Multer สำหรับรับสลิปการชำระเงิน

router.get(
  "/checkout",
  requireUser("/orders/checkout"),
  authorizeRoute,
  orderController.checkout,
);

router.get(
  "/my-orders",
  requireUser("/orders/my-orders"),
  authorizeRoute,
  orderController.myOrders
);

router.get("/:id", authorizeRoute, orderController.detail);
router.get("/:id/payment-slip", authorizeRoute, orderController.paymentSlip);

// รับไฟล์ชื่อ payment_slip ก่อนเข้า Controller
router.post(
  "/create",
  requireUser("/orders/checkout"),
  authorizeRoute,
  upload.single("payment_slip"),
  orderController.create
);



module.exports = router;
