const router = require("express").Router();
const adminController = require("../controllers/admin.controller");
const roleController = require("../controllers/role.controller");
const permissionController = require("../controllers/permission.controller");
const activityLogController = require("../controllers/activityLog.controller");
const Category = require("../models/category.model");
const upload = require("../middleware/upload");
const auditedUpload = require("../middleware/auditedUpload");
const authorizeRoute = require("../middleware/permissionAuth");

router.get("/", authorizeRoute, adminController.dashboard);

router.get("/roles", authorizeRoute, roleController.roles);
router.post("/roles", authorizeRoute, roleController.createRole);
router.post("/roles/:id/edit", authorizeRoute, roleController.updateRole);
router.post("/roles/:id/delete", authorizeRoute, roleController.deleteRole);
router.get("/users", authorizeRoute, roleController.users);
router.post("/users/:id/role", authorizeRoute, roleController.updateUserRole);
router.get("/permissions", authorizeRoute, permissionController.permissions);
router.post("/permissions", authorizeRoute, permissionController.create);
router.post("/permissions/:id/edit", authorizeRoute, permissionController.update);
router.post("/permissions/:id/delete", authorizeRoute, permissionController.remove);
router.get("/acl", authorizeRoute, permissionController.acl);
router.post("/acl/:roleId/:permissionId", authorizeRoute, permissionController.setAcl);
router.get("/logs", authorizeRoute, activityLogController.index);

router.get("/products", authorizeRoute, adminController.products);

router.get("/orders", authorizeRoute, adminController.orders);

router.get("/products/create", authorizeRoute, async (req, res) => {
    const categories = await Category.findAll();

    res.render("admin/product-create", {
        categories,
    });
});

router.get("/products/:id/variants", authorizeRoute, adminController.variants);

router.get("/products/:id/edit", authorizeRoute, adminController.editProductForm);

router.post("/products/create", authorizeRoute, adminController.createProduct);

router.post("/products/:id/variants", authorizeRoute, adminController.createVariant);

router.post(
    "/products/:id/edit",
    authorizeRoute,
    auditedUpload(upload, "image", "product_image"),
    adminController.editProduct,
);

router.post("/products/:id/status", authorizeRoute, adminController.updateProductStatus);

router.post("/products/:id/variants/:variantId/edit", authorizeRoute, adminController.editVariant);

router.post(
    "/products/:id/variants/:variantId/delete",
    authorizeRoute,
    adminController.deleteVariant,
);

router.post("/orders/:id/status", authorizeRoute, adminController.updateOrderStatus);

module.exports = router;
