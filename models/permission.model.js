const pool = require("../db/pool");

const functionCatalog = [
  ["GET", "/admin", "Dashboard"],
  ["GET", "/admin/products", "รายการสินค้า"],
  ["GET", "/admin/orders", "รายการคำสั่งซื้อ"],
  ["GET", "/admin/products/create", "ฟอร์มเพิ่มสินค้า"],
  ["GET", "/admin/products/:id/variants", "ดู Variant สินค้า"],
  ["GET", "/admin/products/:id/edit", "ฟอร์มแก้ไขสินค้า"],
  ["POST", "/admin/products/create", "เพิ่มสินค้า"],
  ["POST", "/admin/products/:id/variants", "เพิ่ม Variant"],
  ["POST", "/admin/products/:id/edit", "แก้ไขสินค้า"],
  ["POST", "/admin/products/:id/status", "เปลี่ยนสถานะสินค้า"],
  ["POST", "/admin/products/:id/variants/:variantId/edit", "แก้ Variant/Stock"],
  ["POST", "/admin/products/:id/variants/:variantId/delete", "ลบ Variant"],
  ["POST", "/admin/orders/:id/status", "เปลี่ยนสถานะคำสั่งซื้อ"],
  ["GET", "/admin/roles", "ดู Role"],
  ["POST", "/admin/roles", "เพิ่ม Role"],
  ["POST", "/admin/roles/:id/edit", "แก้ Role"],
  ["POST", "/admin/roles/:id/delete", "ลบ Role"],
  ["GET", "/admin/users", "ดูผู้ใช้"],
  ["POST", "/admin/users/:id/role", "กำหนด Role ผู้ใช้"],
  ["GET", "/admin/permissions", "ดู Permission"],
  ["POST", "/admin/permissions", "เพิ่ม Permission"],
  ["POST", "/admin/permissions/:id/edit", "แก้ Permission"],
  ["POST", "/admin/permissions/:id/delete", "ลบ Permission"],
  ["GET", "/admin/acl", "ดู ACL matrix"],
  ["POST", "/admin/acl/:roleId/:permissionId", "กำหนด ACL"],
  ["GET", "/cart", "ดูตะกร้า"],
  ["POST", "/cart/add", "เพิ่มสินค้าลงตะกร้า"],
  ["POST", "/cart/remove", "ลบสินค้าจากตะกร้า"],
  ["POST", "/cart/update", "แก้จำนวนในตะกร้า"],
  ["GET", "/orders/checkout", "Checkout"],
  ["GET", "/orders/my-orders", "ประวัติคำสั่งซื้อ"],
  ["GET", "/orders/:id", "รายละเอียดคำสั่งซื้อ"],
  ["GET", "/orders/:id/payment-slip", "ดูสลิปคำสั่งซื้อ"],
  ["POST", "/orders/create", "ส่งคำสั่งซื้อและสลิป"],
].map(([method, path, label]) => ({ method, path, label }));

exports.functionCatalog = functionCatalog;

exports.userHasAnyPermission = async (userId, permissionNames) => {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN role_permissions rp ON rp.role_id = u.role_id
        JOIN permissions p ON p.permission_id = rp.permission_id
        WHERE u.user_id = $1 AND p.name = ANY($2::varchar[])
      ) AS allowed
    `,
    [userId, permissionNames],
  );

  return result.rows[0].allowed;
};

exports.userHasPermissionForRoute = async (userId, method, routePath) => {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN role_permissions rp ON rp.role_id = u.role_id
        JOIN permission_routes pr ON pr.permission_id = rp.permission_id
        WHERE u.user_id = $1
          AND pr.http_method = $2
          AND pr.route_path = $3
      ) AS allowed
    `,
    [userId, method, routePath],
  );

  return result.rows[0].allowed;
};

exports.findAll = async () => {
  const result = await pool.query(`
    SELECT p.permission_id, p.name, p.description, p.is_system,
           COUNT(DISTINCT rp.role_id)::INTEGER AS role_count,
           ARRAY_REMOVE(ARRAY_AGG(DISTINCT pr.http_method || ' ' || pr.route_path), NULL) AS routes
    FROM permissions p
    LEFT JOIN role_permissions rp ON rp.permission_id = p.permission_id
    LEFT JOIN permission_routes pr ON pr.permission_id = p.permission_id
    GROUP BY p.permission_id
    ORDER BY p.is_system DESC, p.name
  `);

  return result.rows;
};

exports.create = async (name, description, method, routePath) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING permission_id, name, description, is_system`,
      [name, description],
    );
    await client.query(
      `INSERT INTO permission_routes (permission_id, http_method, route_path, description)
       VALUES ($1, $2, $3, $4)`,
      [result.rows[0].permission_id, method, routePath, description],
    );
    await client.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT role_id, $1 FROM roles WHERE name = 'ADMIN'
       ON CONFLICT DO NOTHING`,
      [result.rows[0].permission_id],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.update = async (permissionId, name, description, method, routePath) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE permissions SET name = $1, description = $2 WHERE permission_id = $3 AND is_system = FALSE RETURNING permission_id`,
      [name, description, permissionId],
    );
    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("DELETE FROM permission_routes WHERE permission_id = $1", [permissionId]);
    await client.query(
      `INSERT INTO permission_routes (permission_id, http_method, route_path, description)
       VALUES ($1, $2, $3, $4)`,
      [permissionId, method, routePath, description],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.deleteCustom = async (permissionId) => {
  const result = await pool.query(
    `DELETE FROM permissions WHERE permission_id = $1 AND is_system = FALSE RETURNING permission_id`,
    [permissionId],
  );

  return result.rowCount > 0;
};

exports.findAllWithAcl = async () => {
  const result = await pool.query(`
    SELECT r.role_id, r.name AS role_name,
           p.permission_id, p.name AS permission_name, p.description,
           (rp.permission_id IS NOT NULL) AS assigned
    FROM roles r
    CROSS JOIN permissions p
    LEFT JOIN role_permissions rp
      ON rp.role_id = r.role_id AND rp.permission_id = p.permission_id
    ORDER BY CASE WHEN r.name = 'ADMIN' THEN 0 ELSE 1 END, r.name,
             p.name
  `);

  return result.rows;
};

exports.setRolePermission = async (roleId, permissionId, enabled) => {
  if (enabled) {
    const result = await pool.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.role_id, p.permission_id
       FROM roles r CROSS JOIN permissions p
       WHERE r.role_id = $1 AND p.permission_id = $2 AND r.name <> 'ADMIN'
       ON CONFLICT DO NOTHING
       RETURNING role_id`,
      [roleId, permissionId],
    );

    return result.rowCount > 0;
  }

  const result = await pool.query(
    `DELETE FROM role_permissions rp
     USING roles r
     WHERE rp.role_id = r.role_id
       AND rp.role_id = $1 AND rp.permission_id = $2
       AND r.name <> 'ADMIN'
     RETURNING rp.role_id`,
    [roleId, permissionId],
  );

  return result.rowCount > 0;
};
