const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Category = require("../models/category.model");

exports.products = async (req, res) => {
  const products = await Product.findAll();

  res.render("admin/products", {
    products,
  });
};

exports.createProduct = async (req, res) => {
  const { code, name, category_id, price, description } = req.body;

  if (!code || !name || !category_id || !price) {
    return res.status(400).send("กรุณากรอกข้อมูลสินค้าให้ครบ");
  }

  if (!code.trim() || !name.trim()) {
    return res.status(400).send("รหัสสินค้าและชื่อสินค้าห้ามเป็นค่าว่าง");
  }

  if (!Number.isInteger(Number(category_id))) {
    return res.status(400).send("category_id ต้องเป็นตัวเลข");
  }

  if (isNaN(Number(price))) {
    return res.status(400).send("ราคาสินค้าต้องเป็นตัวเลข");
  }

  if (Number(price) < 0) {
    return res.status(400).send("ราคาสินค้าต้องไม่ติดลบ");
  }

  const category = await Category.findById(category_id);

  if (!category) {
    return res.status(404).send("ไม่พบหมวดหมู่นี้");
  }

  try {
    await Product.create(code, name, category_id, price, description);

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).send("รหัสสินค้านี้มีอยู่แล้ว");
    }

    res.status(500).send("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
  }
};

exports.createVariant = async (req, res) => {
  const product_id = req.params.id;
  const { size, color, stock } = req.body;

  if (stock === undefined || Number(stock) < 0) {
    return res.status(400).send("Stock ต้องเป็น 0 หรือมากกว่า");
  }

  const product = await Product.findById(product_id);

  if (!product) {
    return res.status(404).send("ไม่พบสินค้านี้");
  }

  try {
    await Product.createVariant(product_id, size, color, stock);

    res.redirect(`/admin/products/${product_id}/variants`);
  } catch (error) {
    console.error(error);

    if (error.code === "23503") {
      return res.status(404).send("ไม่พบสินค้าที่ต้องการเพิ่ม Variant");
    }

    res.status(500).send("เกิดข้อผิดพลาดในการเพิ่ม Variant");
  }
};

exports.variants = async (req, res) => {
  const productId = req.params.id;

  const product = await Product.findById(productId);

  const variants = await Product.findVariants(productId);

  res.render("admin/variants", {
    product,
    variants,
  });
};

exports.editProduct = async (req, res) => {
  const productId = req.params.id;

  if (!Number.isInteger(Number(productId))) {
    return res.status(400).send("productId ต้องเป็นตัวเลข");
  }

  const { code, name, category_id, price, description, status } = req.body;

  if (typeof code !== "string" || typeof name !== "string") {
    return res.status(400).send("รหัสสินค้าและชื่อสินค้าต้องเป็นข้อความ");
  }

  if (!code.trim() || !name.trim()) {
    return res.status(400).send("รหัสสินค้าและชื่อสินค้าห้ามเป็นค่าว่าง");
  }

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).send("ไม่พบสินค้านี้");
  }

  const existingProduct = await Product.findByCode(code);

  if (existingProduct && existingProduct.product_id != productId) {
    return res.status(409).send("รหัสสินค้านี้มีอยู่แล้ว");
  }

  if (!code || !name || !category_id || !price) {
    return res.status(400).send("กรุณากรอกข้อมูลสินค้าให้ครบ");
  }

  if (!Number.isInteger(Number(category_id))) {
    return res.status(400).send("category_id ต้องเป็นตัวเลข");
  }

  if (isNaN(Number(price))) {
    return res.status(400).send("ราคาสินค้าต้องเป็นตัวเลข");
  }

  if (Number(price) < 0) {
    return res.status(400).send("ราคาสินค้าต้องไม่ติดลบ");
  }

  const category = await Category.findById(category_id);

  if (!category) {
    return res.status(404).send("ไม่พบหมวดหมู่นี้");
  }

  const allowedStatus = ["ACTIVE", "INACTIVE"];

  if (!allowedStatus.includes(status)) {
    return res.status(400).send("สถานะสินค้าไม่ถูกต้อง");
  }

  try {
    await Product.update(
      productId,
      code,
      name,
      category_id,
      price,
      description,
      status,
    );

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).send("รหัสสินค้านี้มีอยู่แล้ว");
    }

    res.status(500).send("เกิดข้อผิดพลาดในการแก้ไขสินค้า");
  }
};

exports.editProductForm = async (req, res) => {
  const productId = req.params.id;

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).send("ไม่พบสินค้า");
  }

  const categories = await Category.findAll();

  res.render("admin/product-edit", {
    product,
    categories,
  });
};

exports.updateProductStatus = async (req, res) => {
  const productId = req.params.id;
  const { status } = req.body;

  if (!Number.isInteger(Number(productId))) {
    return res.status(400).send("productId ต้องเป็นตัวเลข");
  }

  const allowedStatus = ["ACTIVE", "INACTIVE"];

  if (!allowedStatus.includes(status)) {
    return res.status(400).send("สถานะสินค้าไม่ถูกต้อง");
  }

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).send("ไม่พบสินค้านี้");
  }

  await Product.updateStatus(productId, status);

  res.redirect("/admin/products");
};

exports.editVariant = async (req, res) => {
  const variantId = req.params.variantId;
  const productId = req.params.id;

  if (!Number.isInteger(Number(productId))) {
    return res.status(400).send("productId ต้องเป็นตัวเลข");
  }

  if (!Number.isInteger(Number(variantId))) {
    return res.status(400).send("variantId ต้องเป็นตัวเลข");
  }

  const { size, color, stock } = req.body;

  if (stock === undefined || Number(stock) < 0) {
    return res.status(400).send("Stock ต้องเป็น 0 หรือมากกว่า");
  }

  const variants = await Product.findVariants(productId);

  const variant = variants.find((item) => item.variant_id == variantId);

  if (!variant) {
    return res.status(404).send("ไม่พบ Variant นี้");
  }

  try {
    await Product.updateVariant(variantId, size, color, stock);

    res.redirect(`/admin/products/${productId}/variants`);
  } catch (error) {
    console.error(error);

    res.status(500).send("เกิดข้อผิดพลาดในการแก้ไข Variant");
  }
};

exports.orders = async (req, res) => {
  const orders = await Order.findAll();

  res.render("admin/orders", {
    orders,
  });
};

exports.updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const allowedStatus = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

  if (!allowedStatus.includes(status)) {
    return res.status(400).send("สถานะไม่ถูกต้อง");
  }

  await Order.updateStatus(orderId, status);

  res.redirect("/admin/orders");
};
