const pool = require("../db/pool");

exports.create = async (customerName, studentId, phone, totalPrice) => {
  const result = await pool.query(
    `
        INSERT INTO orders
            (customer_name, student_id, phone, total_price)
        VALUES
            ($1, $2, $3, $4)
        RETURNING *
    `,
    [customerName, studentId, phone, totalPrice],
  );

  return result.rows[0];
};

exports.createItem = async (orderId, variantId, quantity, price) => {
  const result = await pool.query(
    `
        INSERT INTO order_items
            (order_id, variant_id, quantity, price)
        VALUES
            ($1, $2, $3, $4)
        RETURNING *
    `,
    [orderId, variantId, quantity, price],
  );

  return result.rows[0];
};

// ลดสต็อกสินค้า
exports.reduceStock = async (variantId, quantity) => {
  const result = await pool.query(
    `
        UPDATE product_variants
        SET stock = stock - $1
        WHERE variant_id = $2
          AND stock >= $1
        RETURNING *
    `,
    [quantity, variantId],
  );

  return result.rows[0];
};

// สร้างคำสั่งซื้อพร้อมรายการสินค้าและลดสต็อกสินค้า
exports.createOrder = async (
  customerName,
  studentId,
  phone,
  totalPrice,
  payment_slip_path,
  checkout_token,
  items,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. สร้าง Order
    const orderResult = await client.query(
      `
            INSERT INTO orders
                (customer_name, student_id, phone, total_price, payment_slip_path, checkout_token)
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `,
      [customerName, studentId, phone, totalPrice, payment_slip_path, checkout_token],
    );

    const order = orderResult.rows[0];

    // 2. สร้าง Order Items + ตัด Stock
    for (const item of items) {
      const stockResult = await client.query(
        `
                UPDATE product_variants
                SET stock = stock - $1
                WHERE variant_id = $2
                  AND stock >= $1
                RETURNING *
            `,
        [item.quantity, item.variant_id],
      );

      // Stock ไม่พอ
      if (stockResult.rows.length === 0) {
        throw new Error("สินค้าในตะกร้ามี Stock ไม่เพียงพอ");
      }

      await client.query(
        `
                INSERT INTO order_items
                    (order_id, variant_id, quantity, price)
                VALUES
                    ($1, $2, $3, $4)
            `,
        [order.order_id, item.variant_id, item.quantity, item.price],
      );
    }

    await client.query("COMMIT");

    return order;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

exports.findById = async (orderId) => {
  const orderResult = await pool.query(
    `
        SELECT
            order_id,
            customer_name,
            student_id,
            phone,
            total_price,
            payment_slip_path,
            status,
            created_at
        FROM orders
        WHERE order_id = $1
    `,
    [orderId],
  );

  const itemResult = await pool.query(
    `
        SELECT
            oi.quantity,
            oi.price,
            p.name,
            v.size,
            v.color
        FROM order_items oi
        JOIN product_variants v
            ON oi.variant_id = v.variant_id
        JOIN products p
            ON v.product_id = p.product_id
        WHERE oi.order_id = $1
    `,
    [orderId],
  );

  const order = orderResult.rows[0];

  if (!order) {
    return null;
  }

  order.items = itemResult.rows;

  return order;
};

exports.findAll = async () => {
  const result = await pool.query(`
        SELECT
            order_id,
            customer_name,
            student_id,
            phone,
            total_price,
            payment_slip_path,
            status,
            created_at
        FROM orders
        ORDER BY created_at DESC
    `);

  return result.rows;
};

exports.updateStatus = async (orderId, status) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
            SELECT order_id, status
            FROM orders
            WHERE order_id = $1
            FOR UPDATE
            `,
      [orderId],
    );

    if (orderResult.rows.length === 0) {
      throw new Error("ไม่พบคำสั่งซื้อ");
    }

    const order = orderResult.rows[0];

    // คืน Stock เฉพาะตอน PENDING → CANCELLED
    if (order.status === "PENDING" && status === "CANCELLED") {
      const itemsResult = await client.query(
        `
        SELECT variant_id, quantity
        FROM order_items
        WHERE order_id = $1
        `,
        [orderId],
      );

      for (const item of itemsResult.rows) {
        await client.query(
          `
            UPDATE product_variants
            SET stock = stock + $1
            WHERE variant_id = $2
            `,
          [item.quantity, item.variant_id],
        );
      }
    }

    await client.query(
      `
            UPDATE orders
            SET status = $1
            WHERE order_id = $2
            `,
      [status, orderId],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.getSalesSummary = async () => {
  const result = await pool.query(`
        SELECT
            COUNT(*) AS order_count,
            COALESCE(SUM(total_price), 0) AS total_sales
        FROM orders
        WHERE status = 'COMPLETED'
    `);

  return result.rows[0];
};

exports.getDailySales = async () => {
  const result = await pool.query(`
        SELECT
            TO_CHAR(
                DATE(created_at AT TIME ZONE 'Asia/Bangkok'),
                'DD/MM/YYYY'
            ) AS sale_date,
            COUNT(*) AS order_count,
            SUM(total_price) AS total_sales
        FROM orders
        WHERE status = 'COMPLETED'
        GROUP BY DATE(created_at AT TIME ZONE 'Asia/Bangkok')
        ORDER BY DATE(created_at AT TIME ZONE 'Asia/Bangkok') DESC
    `);

  return result.rows;
};

exports.getBestSellingProducts = async () => {
  const result = await pool.query(`
        SELECT
            p.name,
            SUM(oi.quantity) AS total_quantity
        FROM order_items oi
        JOIN product_variants v
            ON oi.variant_id = v.variant_id
        JOIN products p
            ON v.product_id = p.product_id
        JOIN orders o
            ON oi.order_id = o.order_id
        WHERE o.status = 'COMPLETED'
        GROUP BY p.product_id, p.name
        ORDER BY total_quantity DESC
    `);

  return result.rows;
};

exports.getCategorySales = async () => {
  const result = await pool.query(`
        SELECT
            c.name AS category_name,
            SUM(oi.quantity * oi.price) AS total_sales
        FROM order_items oi
        JOIN product_variants v
            ON oi.variant_id = v.variant_id
        JOIN products p
            ON v.product_id = p.product_id
        JOIN categories c
            ON p.category_id = c.category_id
        JOIN orders o
            ON oi.order_id = o.order_id
        WHERE o.status = 'COMPLETED'
        GROUP BY c.category_id, c.name
        ORDER BY total_sales DESC
    `);

  return result.rows;
};
