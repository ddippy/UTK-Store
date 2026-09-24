const Order = require("../models/order.model");
const Cart = require("../models/cart.model");

exports.create = async (req, res) => {
    try {
        const {
            customer_name,
            student_id,
            phone
        } = req.body;

        const cart = req.session.cart || [];

        if (cart.length === 0) {
            return res.send("ตะกร้าสินค้าว่าง");
        }

        const items = await Cart.findItems(cart);

        const cartItems = items.map(item => {
            const cartItem = cart.find(
                cartItem => cartItem.variant_id == item.variant_id
            );

            return {
                variant_id: item.variant_id,
                quantity: Number(cartItem.quantity),
                price: Number(item.price)
            };
        });

        const total = cartItems.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);

        const order = await Order.createOrder(
            customer_name,
            student_id,
            phone,
            total,
            cartItems
        );

        // สั่งซื้อสำเร็จ → ล้างตะกร้า
        req.session.cart = [];

        // แสดงหน้าสำเร็จ
        res.render("orders/success", {
            order
        });

    } catch (error) {

        console.error(error);

        res.status(400).send(
            "สั่งซื้อไม่สำเร็จ: " + error.message
        );
    }
};

// แสดงรายละเอียดคำสั่งซื้อ
exports.detail = async (req, res) => {

    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
        return res.status(404).send("ไม่พบคำสั่งซื้อ");
    }

    res.render("orders/detail", {
        order
    });
};