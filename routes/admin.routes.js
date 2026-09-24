const router = require("express").Router();
const adminController = require("../controllers/admin.controller");

router.get("/", (req, res) => {
  res.render("admin/dashboard");
});

router.get("/products", 
    adminController.products
);

router.get("/orders", 
    adminController.orders);

router.get("/products/create", (req, res) => {
  res.render("admin/product-create");
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
