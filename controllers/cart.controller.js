const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

exports.list = async (req, res) => {
  const cart = req.session.cart || [];

  const items = await Cart.findItems(cart);

  const cartItems = items.map((item) => {
    const cartItem = cart.find(
      (cartItem) => cartItem.variant_id == item.variant_id,
    );

    return {
      ...item,
      quantity: Number(cartItem.quantity),
    };
  });

  const total = cartItems.reduce((sum, item) => {
    return sum + Number(item.price) * item.quantity;
  }, 0);

  res.render("cart/list", {
    items: cartItems,
    total,
  });
};

exports.add = async (req, res) => {
  const { variant_id, quantity } = req.body;

  if (!variant_id || !quantity) {
    return res.status(400).send("กรุณาระบุสินค้าและจำนวน");
  }

  const qty = Number(quantity);

  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).send("จำนวนสินค้าต้องเป็นจำนวนเต็มมากกว่า 0");
  }

  const variant = await Product.findActiveVariant(variant_id);

  if (!variant) {
    return res.status(404).send("ไม่พบสินค้าหรือสินค้านี้ไม่เปิดขาย");
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const existingItem = req.session.cart.find(
    (item) => item.variant_id === variant_id,
  );

  const currentQuantity = existingItem ? Number(existingItem.quantity) : 0;

  if (currentQuantity + qty > variant.stock) {
    return res.status(400).send("จำนวนสินค้าในตะกร้ามากกว่า Stock ที่มี");
  }

  if (existingItem) {
    existingItem.quantity = Number(existingItem.quantity) + qty;
  } else {
    req.session.cart.push({
      variant_id,
      quantity: qty,
    });
  }

  console.log(req.session.cart);

  res.redirect("/cart");
};

exports.update = async (req, res) => {
  const { variant_id, quantity } = req.body;

  if (!variant_id || !quantity) {
    return res.status(400).send("กรุณาระบุสินค้าและจำนวน");
  }

  const qty = Number(quantity);

  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).send("จำนวนสินค้าต้องเป็นจำนวนเต็มมากกว่า 0");
  }

  const variant = await Product.findActiveVariant(variant_id);

  if (!variant) {
    return res.status(404).send("ไม่พบสินค้าหรือสินค้านี้ไม่เปิดขาย");
  }

  if (!req.session.cart) {
    return res.status(400).send("ตะกร้าสินค้าว่าง");
  }

  const item = req.session.cart.find((item) => item.variant_id === variant_id);

  if (!item) {
    return res.status(404).send("ไม่พบสินค้าในตะกร้า");
  }

  if (qty > variant.stock) {
    return res.status(400).send("จำนวนสินค้ามากกว่า Stock ที่มี");
  }

  item.quantity = qty;

  res.redirect("/cart");
};

exports.remove = async (req, res) => {
  const { variant_id } = req.body;

  if (!variant_id) {
    return res.status(400).send("กรุณาระบุสินค้า");
  }

  if (!req.session.cart) {
    return res.status(400).send("ตะกร้าสินค้าว่าง");
  }

  const item = req.session.cart.find((item) => item.variant_id === variant_id);

  if (!item) {
    return res.status(404).send("ไม่พบสินค้าในตะกร้า");
  }

  req.session.cart = req.session.cart.filter(
    (item) => item.variant_id !== variant_id,
  );

  res.redirect("/cart");
};
