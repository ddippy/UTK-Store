const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const User = require("../models/user.model");
const Permission = require("../models/permission.model");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

exports.create = async (req, res) => {
  try {
    const { checkout_token } = req.body;
    // ต้องแนบสลิปก่อนสั่งซื้อ
    if (!req.file) {
      return res.status(400).send("กรุณาแนบสลิปการชำระเงิน");
    }

    // ดึงข้อมูล User ที่ Login อยู่
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(401).send("ไม่พบข้อมูล User");
    }

    if (!checkout_token) {
      return res.status(400).send("ไม่พบ Checkout Token");
    }

    // ข้อมูลผู้สั่งซื้อจาก User
    const customer_name = user.name;
    const student_id = user.student_id;
    const phone = user.phone;

    // ดึง Cart จาก Session
    const cart = req.session.cart || [];

    if (cart.length === 0) {
      return res.send("ตะกร้าสินค้าว่าง");
    }

    // ดึงข้อมูลสินค้า
    const items = await Cart.findItems(cart);

    // เตรียมรายการสินค้าใน Order
    const cartItems = items.map((item) => {
      const cartItem = cart.find(
        (cartItem) => cartItem.variant_id == item.variant_id,
      );

      return {
        variant_id: item.variant_id,
        quantity: Number(cartItem.quantity),
        price: Number(item.price),
      };
    });

    // คำนวณยอดรวม
    const total = cartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    // Path ของสลิปที่ Multer บันทึกไว้
    const payment_slip_path = `/uploads/${req.file.filename}`;

    // สร้าง Order
    const order = await Order.createOrder(
      customer_name,
      student_id,
      phone,
      total,
      payment_slip_path,
      checkout_token,
      cartItems,
    );

    // สั่งซื้อสำเร็จ → ล้างตะกร้า
    req.session.cart = [];

    // แสดงหน้าสำเร็จ
    res.redirect(
      `/products?success=1&orderId=${order.order_id}&total=${order.total_price}`,
    );
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      if (req.file) {
        const filePath = path.join("public", "uploads", req.file.filename);

        try {
          await fs.promises.unlink(filePath);
        } catch (fileError) {
          console.error("ลบไฟล์สลิปที่ซ้ำไม่สำเร็จ:", fileError);
        }
      }

      return res.status(400).send("คำสั่งซื้อนี้ถูกส่งไปแล้ว");
    }

    res.status(400).send("สั่งซื้อไม่สำเร็จ: " + error.message);
  }
};

// แสดงรายละเอียดคำสั่งซื้อ
exports.detail = async (req, res) => {
  const orderId = req.params.id;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).send("ไม่พบคำสั่งซื้อ");
  }

  const canViewOrder = await mayViewOrder(req, order);
  if (!canViewOrder) return res.status(403).send("คุณไม่มีสิทธิ์ดูคำสั่งซื้อนี้");

  res.render("orders/detail", {
    order,
  });
};

exports.paymentSlip = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || !order.payment_slip_path) {
    return res.status(404).send("ไม่พบไฟล์");
  }

  const canViewOrder = await mayViewOrder(req, order, ["orders.read", "payment_slips.read"]);
  if (!canViewOrder) return res.status(403).send("คุณไม่มีสิทธิ์ดูไฟล์นี้");

  if (!order.payment_slip_path.startsWith("/uploads/")) {
    return res.status(404).send("ไม่พบไฟล์");
  }
  const uploadDirectory = path.resolve("public", "uploads");
  const filePath = path.resolve(uploadDirectory, path.basename(order.payment_slip_path));
  if (!filePath.startsWith(`${uploadDirectory}${path.sep}`)) {
    return res.status(404).send("ไม่พบไฟล์");
  }

  res.sendFile(filePath, (error) => {
    if (error && !res.headersSent) res.status(404).send("ไม่พบไฟล์");
  });
};

const mayViewOrder = async (req, order, fullAccessPermissions = ["orders.read"]) => {
  if (req.session.adminId) return true;
  const user = await User.findById(req.session.userId);
  if (!user) return false;

  const canViewAllOrders = await Permission.userHasAnyPermission(
    user.user_id,
    fullAccessPermissions,
  );
  return canViewAllOrders || String(order.student_id) === String(user.student_id);
};

exports.checkout = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).send("ไม่พบข้อมูล User");
    }
    const checkoutToken = crypto.randomUUID();

    res.render("orders/checkout", {
      user,
      checkoutToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};

exports.myOrders = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).send("ไม่พบข้อมูล User");
    }

    const orders = await Order.findByStudentId(user.student_id);

    res.render("orders/my-orders", {
      user,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};
