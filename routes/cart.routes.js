const router = require("express").Router();
const cartController = require("../controllers/cart.controller");

// เพิ่มสินค้าเข้าตะกร้า
router.post("/add", (req, res) => {
    const { variant_id, quantity } = req.body;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingItem = req.session.cart.find(
        item => item.variant_id === variant_id
    );

    if (existingItem) {
        existingItem.quantity =
            Number(existingItem.quantity) + Number(quantity);
    } else {
        req.session.cart.push({
            variant_id,
            quantity
        });
    }

    console.log(req.session.cart);

    res.send("เพิ่มสินค้าเข้าตะกร้าแล้ว");
});

// ลบสินค้าออกจากตะกร้า
router.post("/remove", (req, res) => {
    const { variant_id } = req.body;

    req.session.cart = req.session.cart.filter(
        item => item.variant_id !== variant_id
    );

    res.redirect("/cart");
});

// อัปเดตจำนวนสินค้าในตะกร้า
router.post("/update", (req, res) => {
    const { variant_id, quantity } = req.body;

    const item = req.session.cart.find(
        item => item.variant_id === variant_id
    );

    if (item) {
        item.quantity = Number(quantity);
    }

    res.redirect("/cart");
});

router.get("/", cartController.list);

module.exports = router;
