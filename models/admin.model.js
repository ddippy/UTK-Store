const pool = require("../db/pool");

exports.findByUsername = async (username) => {
  const result = await pool.query(
    `
        SELECT
            admin_id,
            username,
            password_hash
        FROM admins
        WHERE username = $1
    `,
    [username],
  );

  return result.rows[0];
};
