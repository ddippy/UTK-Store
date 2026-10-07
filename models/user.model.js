const pool = require("../db/pool");

// ค้นหา User จาก Username (เพิ่มดึง field 'role' สำหรับ session)
exports.findByUsername = async (username) => {
  const result = await pool.query(
    `
        SELECT
            user_id,
            username,
            password_hash,
            name,
            student_id,
            phone,
            role
        FROM users
        WHERE username = $1
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
            user_id,
            username,
            name,
            student_id,
            phone,
            role
        FROM users
        WHERE user_id = $1
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
        INSERT INTO users (username, password_hash, name, student_id, phone, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id, username, name, student_id, phone, role
    `,
    [username, password_hash, name, student_id, phone, role],
  );

  return result.rows[0];
};
