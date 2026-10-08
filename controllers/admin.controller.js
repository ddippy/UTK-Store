const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Category = require("../models/category.model");
const ActivityLog = require("../models/activityLog.model");

exports.products = async (req, res) => {
    const products = await Product.findAllAdmin();

    res.render("admin/products", {
        products,
    });
};

const validateCategoryName = (value) => {
    const name = typeof value === "string" ? value.trim() : "";
    if (!name || name.length > 100) return null;
    return name;
};

const validCategoryId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

exports.categories = async (req, res) => {
    const categories = await Category.findAll();
    const messages = {
        created: "เพิ่มหมวดหมู่เรียบร้อยแล้ว",
        updated: "บันทึกชื่อหมวดหมู่แล้ว",
        deleted: "ลบหมวดหมู่แล้ว",
    };
    const errors = {
        invalid_name: "กรุณากรอกชื่อหมวดหมู่ไม่เกิน 100 ตัวอักษร",
        duplicate: "มีหมวดหมู่นี้อยู่แล้ว",
        not_found: "ไม่พบหมวดหมู่ที่เลือก",
        in_use: "ลบไม่ได้ เพราะยังมีสินค้าอยู่ในหมวดหมู่นี้",
    };
    res.render("admin/categories", {
        categories,
        message: messages[req.query.message] || null,
        error: errors[req.query.error] || null,
    });
};

exports.createCategory = async (req, res) => {
    const name = validateCategoryName(req.body.name);
    if (!name) return res.redirect("/admin/categories?error=invalid_name");

    try {
        const category = await Category.create(name);
        await ActivityLog.record(req, {
            eventType: "category.create",
            resourceType: "category",
            resourceId: category.category_id,
            details: { name: category.name },
        });
        res.redirect("/admin/categories?message=created");
    } catch (error) {
        if (error.code === "23505") return res.redirect("/admin/categories?error=duplicate");
        console.error(error);
        res.status(500).send("เพิ่มหมวดหมู่ไม่สำเร็จ");
    }
};

exports.updateCategory = async (req, res) => {
    if (!validCategoryId(req.params.id)) return res.redirect("/admin/categories?error=not_found");
    const name = validateCategoryName(req.body.name);
    if (!name) return res.redirect("/admin/categories?error=invalid_name");

    try {
        const category = await Category.update(req.params.id, name);
        if (!category) return res.redirect("/admin/categories?error=not_found");
        await ActivityLog.record(req, {
            eventType: "category.update",
            resourceType: "category",
            resourceId: category.category_id,
            details: { name: category.name },
        });
        res.redirect("/admin/categories?message=updated");
    } catch (error) {
        if (error.code === "23505") return res.redirect("/admin/categories?error=duplicate");
        console.error(error);
        res.status(500).send("แก้ไขหมวดหมู่ไม่สำเร็จ");
    }
};

exports.deleteCategory = async (req, res) => {
    if (!validCategoryId(req.params.id)) return res.redirect("/admin/categories?error=not_found");

    try {
        const category = await Category.delete(req.params.id);
        if (!category) return res.redirect("/admin/categories?error=not_found");
        await ActivityLog.record(req, {
            eventType: "category.delete",
            resourceType: "category",
            resourceId: category.category_id,
            details: { name: category.name },
        });
        res.redirect("/admin/categories?message=deleted");
    } catch (error) {
        if (error.code === "23503") return res.redirect("/admin/categories?error=in_use");
        console.error(error);
        res.status(500).send("ลบหมวดหมู่ไม่สำเร็จ");
    }
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
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        const product = await Product.create(
            code,
            name,
            category_id,
            price,
            description,
            imagePath,
            req.file ? { file: req.file, req } : null,
        );
        req.fileMetadataSaved = Boolean(req.file);
        await ActivityLog.record(req, {
            eventType: "product.create",
            resourceType: "product",
            resourceId: product?.product_id,
            details: { code: code.trim(), name: name.trim() },
        });
        if (req.file) {
            await ActivityLog.record(req, {
                eventType: "file.upload",
                resourceType: "product_image",
                resourceId: product.product_id,
                details: {
                    storedFilename: req.file.filename,
                    originalFilename: req.file.originalname.replace(/[\\/]/g, "_").slice(0, 255),
                    mimeType: req.file.detectedMimeType,
                    sizeBytes: req.file.size,
                },
            });
        }

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
        const variant = await Product.createVariant(product_id, size, color, stock);
        await ActivityLog.record(req, {
            eventType: "product.variant.create",
            resourceType: "product_variant",
            resourceId: variant?.variant_id,
            details: { productId: Number(product_id), stock: Number(stock) },
        });

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

    const imagePath = req.file ? `/uploads/${req.file.filename}` : product.image_path;

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
            imagePath,
            req.file ? { file: req.file, req } : null,
        );
        req.fileMetadataSaved = Boolean(req.file);

        await ActivityLog.record(req, {
            eventType: "product.update",
            resourceType: "product",
            resourceId: productId,
            details: { code: code.trim(), name: name.trim(), status, imageChanged: Boolean(req.file) },
        });
        if (req.file) {
            await ActivityLog.record(req, {
                eventType: "file.upload",
                resourceType: "product_image",
                resourceId: productId,
                details: {
                    storedFilename: req.file.filename,
                    originalFilename: req.file.originalname.replace(/[\\/]/g, "_").slice(0, 255),
                    mimeType: req.file.detectedMimeType,
                    sizeBytes: req.file.size,
                },
            });
        }

        res.redirect("/admin/products");
    } catch (error) {
        console.error(error);

        if (req.file) {
            await ActivityLog.record(req, {
                eventType: "file.upload",
                resourceType: "product_image",
                resourceId: productId,
                outcome: "failure",
                details: {
                    storedFilename: req.file.filename,
                    reason: error.code || "product_update_failed",
                },
            });
        }

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
    await ActivityLog.record(req, {
        eventType: "product.status",
        resourceType: "product",
        resourceId: productId,
        details: { previousStatus: product.status, newStatus: status },
    });

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
        await ActivityLog.record(req, {
            eventType: "product.variant.update",
            resourceType: "product_variant",
            resourceId: variantId,
            details: {
                productId: Number(productId),
                previousStock: Number(variant.stock),
                newStock: Number(stock),
            },
        });

        res.redirect(`/admin/products/${productId}/variants`);
    } catch (error) {
        console.error(error);

        res.status(500).send("เกิดข้อผิดพลาดในการแก้ไข Variant");
    }
};

exports.deleteVariant = async (req, res) => {
    const productId = req.params.id;
    const variantId = req.params.variantId;

    if (!Number.isInteger(Number(productId))) {
        return res.status(400).send("productId ต้องเป็นตัวเลข");
    }

    if (!Number.isInteger(Number(variantId))) {
        return res.status(400).send("variantId ต้องเป็นตัวเลข");
    }

    const variants = await Product.findVariants(productId);

    const variant = variants.find((item) => item.variant_id == variantId);

    if (!variant) {
        return res.status(404).send("ไม่พบ Variant นี้");
    }

    try {
        await Product.deleteVariant(variantId);
        await ActivityLog.record(req, {
            eventType: "product.variant.delete",
            resourceType: "product_variant",
            resourceId: variantId,
            details: { productId: Number(productId) },
        });

        res.redirect(`/admin/products/${productId}/variants`);
    } catch (error) {
        console.error(error);

        if (error.code === "23503") {
            return res.status(409).send("ไม่สามารถลบ Variant นี้ได้ เพราะถูกใช้ใน Order แล้ว");
        }

        res.status(500).send("เกิดข้อผิดพลาดในการลบ Variant");
    }
};

exports.orders = async (req, res) => {
    const orders = await Order.findAll();
    const statusLabels = {
        PENDING: "รอดำเนินการ",
        CONFIRMED: "ยืนยันแล้ว",
        COMPLETED: "สำเร็จ",
        CANCELLED: "ยกเลิกแล้ว",
    };
    const toastMessages = {
        updated: { type: "success", message: "อัปเดตสถานะคำสั่งซื้อแล้ว" },
        invalid_status: { type: "error", message: "สถานะคำสั่งซื้อไม่ถูกต้อง" },
        not_found: { type: "error", message: "ไม่พบคำสั่งซื้อที่ต้องการแก้ไข" },
    };
    let toast = Object.hasOwn(toastMessages, req.query.toast)
        ? toastMessages[req.query.toast]
        : null;
    if (req.query.toast === "invalid_transition") {
        const from = statusLabels[req.query.from];
        const to = statusLabels[req.query.to];
        toast = {
            type: "error",
            message: from && to
                ? `ไม่สามารถเปลี่ยนสถานะจาก “${from}” ไปเป็น “${to}” ได้`
                : "ไม่สามารถเปลี่ยนสถานะคำสั่งซื้อนี้ได้",
        };
    }

    res.render("admin/orders", {
        orders,
        toast,
    });
};

exports.updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const allowedStatus = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

    if (!allowedStatus.includes(status)) {
        return res.redirect("/admin/orders?toast=invalid_status");
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return res.redirect("/admin/orders?toast=not_found");
    }

    const allowedTransitions = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["COMPLETED"],
        COMPLETED: [],
        CANCELLED: [],
    };

    if (!allowedTransitions[order.status].includes(status)) {
        return res.redirect(
            `/admin/orders?toast=invalid_transition&from=${encodeURIComponent(order.status)}&to=${encodeURIComponent(status)}`,
        );
    }

    await Order.updateStatus(orderId, status);
    await ActivityLog.record(req, {
        eventType: "order.status",
        resourceType: "order",
        resourceId: orderId,
        details: { previousStatus: order.status, newStatus: status },
    });

    res.redirect("/admin/orders?toast=updated");
};

exports.dashboard = async (req, res) => {
    const sales = await Order.getSalesSummary();
    const dailySales = await Order.getDailySales();
    const bestSellingProducts = await Order.getBestSellingProducts();
    const categorySales = await Order.getCategorySales();

    res.render("admin/dashboard", {
        sales,
        dailySales,
        bestSellingProducts,
        categorySales,
        adminUsername: req.session.adminUsername || req.session.userName || req.session.username,
        isAdmin: Boolean(req.session.adminId),
    });
};
