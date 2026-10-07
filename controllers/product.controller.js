const Product = require("../models/product.model");

exports.list = async (req, res) => {
    const search =
        typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const requestedCategoryId =
        typeof req.query.category_id === "string" ? Number(req.query.category_id) : null;
    const requestedCategory =
        Number.isInteger(requestedCategoryId) && requestedCategoryId > 0
            ? requestedCategoryId
            : null;
    const selectedCategory =
        (res.locals.storeCategories || []).find(
            (category) => Number(category.category_id) === requestedCategory,
        ) || null;
    const categoryId = selectedCategory ? Number(selectedCategory.category_id) : null;
    const products = await Product.findAll(search, categoryId);

    res.render("products/list", {
        products,
        search,
        categoryId,
        selectedCategory,
        success: req.query.success === "1",
        orderId: req.query.orderId || null,
        total: req.query.total || null,
        error: req.query.error || null,
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
