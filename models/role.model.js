const pool = require("../db/pool");

exports.findAll = async () => {
  const result = await pool.query(`
    SELECT
      r.role_id,
      r.name,
      r.description,
      r.is_system,
      COUNT(DISTINCT u.user_id)::INTEGER AS user_count,
      COUNT(DISTINCT a.admin_id)::INTEGER AS admin_count
    FROM roles r
    LEFT JOIN users u ON u.role_id = r.role_id
    LEFT JOIN admins a ON a.role_id = r.role_id
    GROUP BY r.role_id
    ORDER BY CASE WHEN r.name = 'ADMIN' THEN 0 ELSE 1 END, r.name
  `);

  return result.rows;
};

exports.findAssignableToUsers = async () => {
  const result = await pool.query(
    `SELECT role_id, name, description FROM roles WHERE UPPER(name) <> 'ADMIN' ORDER BY name`,
  );

  return result.rows;
};

exports.create = async (name, description) => {
  const result = await pool.query(
    `INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING role_id, name, description, is_system`,
    [name, description],
  );

  return result.rows[0];
};

exports.updateCustom = async (roleId, name, description) => {
  const result = await pool.query(
    `UPDATE roles SET name = $1, description = $2 WHERE role_id = $3 AND is_system = FALSE RETURNING role_id`,
    [name, description, roleId],
  );

  return result.rowCount > 0;
};

exports.deleteUnassignedCustom = async (roleId) => {
  const result = await pool.query(
    `
      DELETE FROM roles r
      WHERE r.role_id = $1
        AND r.is_system = FALSE
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.role_id = r.role_id)
        AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.role_id = r.role_id)
      RETURNING r.role_id
    `,
    [roleId],
  );

  return result.rowCount > 0;
};
