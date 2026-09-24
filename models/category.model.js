const pool = require("../db/pool");

exports.findById = async (categoryId) => {
  const result = await pool.query(
    `
        SELECT
            category_id,
            name
        FROM categories
        WHERE category_id = $1
    `,
    [categoryId],
  );

  return result.rows[0];
};

exports.findAll = async () => {
  const result = await pool.query(`
        SELECT
            category_id,
            name
        FROM categories
        ORDER BY category_id
    `);

  return result.rows;
};
