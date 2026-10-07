const pool = require("../db/pool");

exports.findByUsername = async (username) => {
    const result = await pool.query(
        `
        SELECT
            admin_id,
            username,
            password_hash,
            r.name AS role
        FROM admins a
        JOIN roles r ON r.role_id = a.role_id
        WHERE a.username = $1
    `,
        [username],
    );

    return result.rows[0];
};
