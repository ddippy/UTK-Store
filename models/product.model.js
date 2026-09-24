const pool = require("../db/pool");

exports.findAll = async () => {
  const result = await pool.query(`
        SELECT
            p.product_id,
            p.code,
            p.name,
            p.price,
            p.description,
            p.image_path,
            p.status,
            c.name AS category_name,
            COALESCE(SUM(v.stock), 0) AS stock
        FROM products p
        JOIN categories c
            ON p.category_id = c.category_id
        LEFT JOIN product_variants v
            ON p.product_id = v.product_id
        GROUP BY
            p.product_id,
            c.name
        ORDER BY p.product_id DESC
    `);

  return result.rows;
};

exports.findById = async (id) => {
  const productResult = await pool.query(
    `
        SELECT
            p.product_id,
            p.code,
            p.name,
            p.price,
            p.description,
            p.image_path,
            p.status,
            c.name AS category_name
        FROM products p
        JOIN categories c
            ON p.category_id = c.category_id
        WHERE p.product_id = $1
    `,
    [id],
  );

  const variantResult = await pool.query(
    `
        SELECT
            variant_id,
            size,
            color,
            stock
        FROM product_variants
        WHERE product_id = $1
        ORDER BY variant_id
    `,
    [id],
  );

  const product = productResult.rows[0];

  if (!product) {
    return null;
  }

  product.variants = variantResult.rows;

  return product;
};

exports.create = async (code, name, categoryId, price, description) => {
  const result = await pool.query(
    `
        INSERT INTO products
            (code, name, category_id, price, description)
        VALUES
            ($1, $2, $3, $4, $5)
        RETURNING *
    `,
    [code, name, categoryId, price, description],
  );

  return result.rows[0];
};

exports.createVariant = async (productId, size, color, stock) => {
  const result = await pool.query(
    `
        INSERT INTO product_variants
            (product_id, size, color, stock)
        VALUES
            ($1, $2, $3, $4)
        RETURNING *
    `,
    [productId, size || null, color || null, stock],
  );

  return result.rows[0];
};

exports.findVariants = async (productId) => {
  const result = await pool.query(
    `
        SELECT
            variant_id,
            size,
            color,
            stock
        FROM product_variants
        WHERE product_id = $1
        ORDER BY variant_id
    `,
    [productId],
  );

  return result.rows;
};

exports.update = async (
  productId,
  code,
  name,
  categoryId,
  price,
  description,
  status,
) => {
  const result = await pool.query(
    `
        UPDATE products
        SET
            code = $1,
            name = $2,
            category_id = $3,
            price = $4,
            description = $5,
            status = $6
        WHERE product_id = $7
        RETURNING *
    `,
    [code, name, categoryId, price, description, status, productId],
  );

  return result.rows[0];
};

exports.updateStatus = async (productId, status) => {
  const result = await pool.query(
    `
        UPDATE products
        SET status = $1
        WHERE product_id = $2
        RETURNING *
    `,
    [status, productId],
  );

  return result.rows[0];
};

exports.updateVariant = async (variantId, size, color, stock) => {
  const result = await pool.query(
    `
        UPDATE product_variants
        SET
            size = $1,
            color = $2,
            stock = $3
        WHERE variant_id = $4
        RETURNING *
    `,
    [size || null, color || null, stock, variantId],
  );

  return result.rows[0];
};
