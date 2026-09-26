const Product = require("../models/product.model");

exports.list = async (req, res) => {
  const products = await Product.findAll();

  res.render("products/list", {
    products,
    success: req.query.success === "1",
    orderId: req.query.orderId || null,
    total: req.query.total || null,
  });
};

exports.detail = async (req, res) => {
  const id = req.params.id;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).send("รหัสสินค้าต้องเป็นตัวเลข");
  }

  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).send("ไม่พบสินค้า");
  }

  if (product.status !== "ACTIVE") {
    return res.status(404).send("ไม่พบสินค้านี้");
  }

  res.render("products/detail", {
    product,
  });
};
