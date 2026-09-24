const Product = require("../models/product.model");

exports.list = async (req, res) => {
  const products = await Product.findAll();

  res.render("products/list", {
    products,
  });
};

exports.detail = async (req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id);

  res.render("products/detail", {
    product,
  });
};
