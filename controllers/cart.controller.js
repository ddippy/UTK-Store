const Cart = require("../models/cart.model");

exports.list = async (req, res) => {
  const cart = req.session.cart || [];

  const items = await Cart.findItems(cart);

  const cartItems = items.map((item) => {
    const cartItem = cart.find(
      (cartItem) => cartItem.variant_id == item.variant_id,
    );

    return {
      ...item,
      quantity: Number(cartItem.quantity),
    };
  });

  const total = cartItems.reduce((sum, item) => {
    return sum + Number(item.price) * item.quantity;
  }, 0);

  res.render("cart/list", {
    items: cartItems,
    total
  });
};
