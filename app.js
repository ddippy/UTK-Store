require("dotenv").config(); // .env จะเป็นตัวที่บอก Node ว่า PostgreSQL อยู่ที่ไหน และใช้ฐานข้อมูลอะไร
const express = require("express");
const session = require("express-session");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true })); // อ่านข้อมูลจาก form
app.use(express.static("public")); // ไฟล์ CSS / รูปภาพ / JavaScript
app.use(
    session({
        secret: "utk-store-secret",
        resave: false,
        saveUninitialized: true
    })
);

app.set("view engine", "ejs"); // ใช้ EJS เป็น View Engine

const productRoutes = require("./routes/product.routes"); // Routes
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  // หน้าแรก
  res.render("home", {
    title: "UTK-Store",
  });
});

app.listen(PORT, () => {
  // เริ่ม Server
  console.log(`Server running at http://localhost:${PORT}`);
});
