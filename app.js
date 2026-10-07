require("dotenv").config(); // .env จะเป็นตัวที่บอก Node ว่า PostgreSQL อยู่ที่ไหน และใช้ฐานข้อมูลอะไร
const express = require("express");
const session = require("express-session");
const path = require("path");
const pool = require("./db/pool");
const userInfo = require("./middleware/userInfo");
const Category = require("./models/category.model");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true })); // อ่านข้อมูลจาก form
app.use("/uploads", async (req, res, next) => {
  try {
    const filename = path.basename(req.path);
    if (filename.startsWith("payment-")) {
      return res.status(404).send("ไม่พบไฟล์");
    }
    if (!filename.startsWith("slip-")) return next();
    const paymentPath = `/uploads/${filename}`;
    const result = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM orders WHERE payment_slip_path = $1) AS is_payment_slip",
      [paymentPath],
    );
    if (result.rows[0].is_payment_slip) {
      return res.status(404).send("ไม่พบไฟล์");
    }
    next();
  } catch (error) {
    next(error);
  }
});
app.use(express.static("public")); // ไฟล์ CSS / รูปภาพ / JavaScript
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);

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
