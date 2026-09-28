const Product = require("../models/product.model");

exports.list = async (req, res) => {
  const products = await Product.findAll();

  res.render("products/list", {
    products,
    success: req.query.success === "1",
    orderId: req.query.orderId || null,
    total: req.query.total || null,
    error: req.query.error || null
  });

};

exports.detail = async (req, res) => {
  const id = req.params.id;

  if (!Number.isInteger(Number(id))) {
    return res.redirect("/products?error=invalid-id");
  }

  const product = await Product.findById(id);

  if (!product) {
    return res.redirect("/products?error=product-not-found");
  }

  if (product.status !== "ACTIVE") {
    return res.redirect("/products?error=inactive");
  }

  res.render("products/detail", {
    product,
  });
};
