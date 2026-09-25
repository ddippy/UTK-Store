const pool = require("../db/pool");

exports.findByUsername = async (username) => {
  const result = await pool.query(
    `
        SELECT
            user_id,
            username,
            password_hash,
            name,
            student_id,
            phone
        FROM users
        WHERE username = $1
    `,
    [username],
  );

  return result.rows[0];
};

exports.findById = async (userId) => {
  const result = await pool.query(
    `
        SELECT
            user_id,
            username,
            name,
            student_id,
            phone
        FROM users
        WHERE user_id = $1
    `,
    [userId],
  );

  return result.rows[0];
};
