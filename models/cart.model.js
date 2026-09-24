const pool = require("../db/pool");

exports.findItems = async (cart) => {
  const variantIds = cart.map((item) => item.variant_id);

  const result = await pool.query(
    `
        SELECT
            v.variant_id,
            p.name,
            p.price,
            v.size,
            v.color,
            v.stock
        FROM product_variants v
        JOIN products p
            ON v.product_id = p.product_id
        WHERE v.variant_id = ANY($1)
    `,
    [variantIds],
  );

  return result.rows;
};
