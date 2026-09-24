exports.findById = async (categoryId) => {
    const result = await pool.query(`
        SELECT
            category_id,
            name
        FROM categories
        WHERE category_id = $1
    `, [categoryId]);

    return result.rows[0];
};