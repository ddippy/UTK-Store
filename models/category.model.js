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

exports.create = async (name) => {
    const result = await pool.query(
        `INSERT INTO categories (name) VALUES ($1) RETURNING category_id, name`,
        [name],
    );
    return result.rows[0];
};

exports.update = async (categoryId, name) => {
    const result = await pool.query(
        `UPDATE categories SET name = $2 WHERE category_id = $1 RETURNING category_id, name`,
        [categoryId, name],
    );
    return result.rows[0] || null;
};

exports.delete = async (categoryId) => {
    const result = await pool.query(
        `DELETE FROM categories WHERE category_id = $1 RETURNING category_id, name`,
        [categoryId],
    );
    return result.rows[0] || null;
};
