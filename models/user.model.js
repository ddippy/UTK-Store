const pool = require("../db/pool");

// ค้นหา User จาก Username พร้อมชื่อ Role ปัจจุบัน
exports.findByUsername = async (username) => {
  const result = await pool.query(
    `
        SELECT
            u.user_id,
            u.username,
            u.password_hash,
            u.name,
            u.student_id,
            u.phone,
            r.name AS role
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE u.username = $1
    `,
    [username],
  );

  return result.rows[0];
};

// ค้นหา User จาก user_id
exports.findById = async (userId) => {
  const result = await pool.query(
    `
        SELECT
            u.user_id,
            u.username,
            u.name,
            u.student_id,
            u.phone,
            r.name AS role
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = $1
    `,
    [userId],
  );

  return result.rows[0];
};

// [ใหม่] ค้นหา User จากรหัสนักศึกษา (ป้องกันการสมัครรหัสซ้ำ)
exports.findByStudentId = async (studentId) => {
  const result = await pool.query(
    `
        SELECT
            user_id,
            username,
            name,
            student_id,
            phone
        FROM users
        WHERE student_id = $1
    `,
    [studentId],
  );

  return result.rows[0];
};

// [ใหม่] บันทึกผู้ใช้ใหม่ลงฐานข้อมูล
exports.create = async ({
  username,
  password_hash,
  name,
  student_id,
  phone,
  role = "USER",
}) => {
  const result = await pool.query(
    `
        INSERT INTO users (username, password_hash, name, student_id, phone, role, role_id)
        VALUES (
          $1, $2, $3, $4, $5, $6,
          (SELECT role_id FROM roles WHERE name = $6)
        )
        RETURNING user_id, username, name, student_id, phone, role
    `,
    [username, password_hash, name, student_id, phone, role],
  );

  return result.rows[0];
};

exports.findAllForAdmin = async () => {
  const result = await pool.query(`
    SELECT u.user_id, u.username, u.name, u.student_id, u.phone,
           r.role_id, r.name AS role_name
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    ORDER BY u.user_id DESC
  `);

  return result.rows;
};

exports.updateRole = async (userId, roleId) => {
  const result = await pool.query(
    `
      UPDATE users u
      SET role_id = $2
      WHERE u.user_id = $1
        AND EXISTS (
          SELECT 1 FROM roles r
          WHERE r.role_id = $2 AND UPPER(r.name) <> 'ADMIN'
        )
      RETURNING u.user_id
    `,
    [userId, roleId],
  );

  return result.rowCount > 0;
};
