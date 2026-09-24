const router = require("express").Router();
const adminController = require("../controllers/admin.controller");
const Category = require("../models/category.model");
const upload = require("../middleware/upload");

router.get("/", adminController.dashboard);

router.get("/products", 
    adminController.products
);

router.get("/orders", 
    adminController.orders);

router.get("/products/create", async (req, res) => {
    const categories = await Category.findAll();

    res.render("admin/product-create", {
        categories
    });
});

router.get("/products/:id/variants", 
    adminController.variants
);

router.get(
    "/products/:id/edit",
    adminController.editProductForm
);

router.post("/products/create", 
    adminController.createProduct
);

router.post(
    "/products/:id/variants",
    adminController.createVariant
);

router.post(
    "/products/:id/edit",
    upload.single("image"),
    adminController.editProduct
);

router.post(
    "/products/:id/status",
    adminController.updateProductStatus
);

router.post(
    "/products/:id/variants/:variantId/edit",
    adminController.editVariant
);

router.post(
    "/orders/:id/status",
    adminController.updateOrderStatus
);

module.exports = router;
