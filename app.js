require("dotenv").config(); // .env จะเป็นตัวที่บอก Node ว่า PostgreSQL อยู่ที่ไหน และใช้ฐานข้อมูลอะไร
const express = require("express");
const session = require("express-session");
const path = require("path");
const userInfo = require("./middleware/userInfo");
const Category = require("./models/category.model");
const ActivityLog = require("./models/activityLog.model");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true })); // อ่านข้อมูลจาก form
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
});

app.use("/uploads", (req, res, next) => {
    const filename = path.basename(req.path);
    if (!filename.startsWith("payment-") && !filename.startsWith("slip-")) {
        return next();
    }

    return sessionMiddleware(req, res, async (error) => {
        if (error) return next(error);

        await ActivityLog.record(req, {
            eventType: "file.access",
            resourceType: "payment_slip",
            resourceId: filename,
            outcome: "denied",
            details: { reason: "direct_public_url_blocked" },
        });
        return res.status(404).send("ไม่พบไฟล์");
    });
});
app.use(express.static("public")); // ไฟล์ CSS / รูปภาพ / JavaScript
app.use(sessionMiddleware);

app.use(userInfo); // middleware userInfo จะทำงานก่อนทุก route
app.use(async (req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/admin")) {
        return next();
    }

    try {
        res.locals.storeCategories = await Category.findAll();
        next();
    } catch (error) {
        next(error);
    }
});

app.set("view engine", "ejs"); // ใช้ EJS เป็น View Engine

const productRoutes = require("./routes/product.routes"); // Routes
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/auth.routes");

app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/", authRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
    // หน้าแรก
    res.render("home", {
        title: "UTK-Store",
    });
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(PORT, () => {
    // เริ่ม Server
    console.log(`Server running at http://localhost:${PORT}`);
});
