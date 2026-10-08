const pool = require("../db/pool");
const FileMetadata = require("./fileMetadata.model");

exports.findAll = async (search = "", categoryId = null) => {
    const result = await pool.query(
        `
        SELECT
            p.product_id,
            p.code,
            p.name,
            p.price,
            p.description,
            p.image_path,
            p.status,
            c.name AS category_name,
            COALESCE(SUM(v.stock), 0) AS stock
        FROM products p
        JOIN categories c
            ON p.category_id = c.category_id
        LEFT JOIN product_variants v
            ON p.product_id = v.product_id
        WHERE p.status = 'ACTIVE'
          AND (
              $1 = ''
              OR p.name ILIKE '%' || $1 || '%'
              OR p.code ILIKE '%' || $1 || '%'
              OR p.description ILIKE '%' || $1 || '%'
              OR c.name ILIKE '%' || $1 || '%'
          )
          AND ($2::INTEGER IS NULL OR p.category_id = $2)
        GROUP BY
            p.product_id,
            c.name
        ORDER BY p.product_id DESC
    `,
        [search, categoryId],
    );

    return result.rows;
};

exports.findById = async (id) => {
    const productResult = await pool.query(
        `
        SELECT
            p.product_id,
            p.code,
            p.name,
            p.category_id,
            p.price,
            p.description,
            p.image_path,
            p.status,
            c.name AS category_name
        FROM products p
        JOIN categories c
            ON p.category_id = c.category_id
        WHERE p.product_id = $1
    `,
        [id],
    );

    const variantResult = await pool.query(
        `
        SELECT
            variant_id,
            size,
            color,
            stock
        FROM product_variants
        WHERE product_id = $1
        ORDER BY variant_id
    `,
        [id],
    );

    const product = productResult.rows[0];

    if (!product) {
        return null;
    }

    product.variants = variantResult.rows;

    return product;
};

exports.create = async (code, name, categoryId, price, description, imagePath = null, imageUpload) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            `
                INSERT INTO products
                    (code, name, category_id, price, description, image_path)
                VALUES
                    ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `,
            [code, name, categoryId, price, description, imagePath],
        );

        if (imageUpload) {
            await FileMetadata.insert(client, {
                file: imageUpload.file,
                resourceType: "product_image",
                resourceId: result.rows[0].product_id,
                req: imageUpload.req,
            });
        }

        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

exports.createVariant = async (productId, size, color, stock) => {
    const result = await pool.query(
        `
        INSERT INTO product_variants
            (product_id, size, color, stock)
        VALUES
            ($1, $2, $3, $4)
        RETURNING *
    `,
        [productId, size || null, color || null, stock],
    );

    return result.rows[0];
};

exports.findVariants = async (productId) => {
    const result = await pool.query(
        `
        SELECT
            variant_id,
            size,
            color,
            stock
        FROM product_variants
        WHERE product_id = $1
        ORDER BY variant_id
    `,
        [productId],
    );

    return result.rows;
};

exports.update = async (
    productId,
    code,
    name,
    categoryId,
    price,
    description,
    status,
    imagePath,
    imageUpload,
) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            `
                UPDATE products
                SET
                    code = $1,
                    name = $2,
                    category_id = $3,
                    price = $4,
                    description = $5,
                    status = $6,
                    image_path = $7
                WHERE product_id = $8
                RETURNING *
            `,
            [code, name, categoryId, price, description, status, imagePath, productId],
        );

        if (imageUpload) {
            await FileMetadata.insert(client, {
                file: imageUpload.file,
                resourceType: "product_image",
                resourceId: productId,
                req: imageUpload.req,
            });
        }

        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

exports.updateStatus = async (productId, status) => {
    const result = await pool.query(
        `
        UPDATE products
        SET status = $1
        WHERE product_id = $2
        RETURNING *
    `,
        [status, productId],
    );

    return result.rows[0];
};

exports.updateVariant = async (variantId, size, color, stock) => {
    const result = await pool.query(
        `
        UPDATE product_variants
        SET
            size = $1,
            color = $2,
            stock = $3
        WHERE variant_id = $4
        RETURNING *
    `,
        [size || null, color || null, stock, variantId],
    );

    return result.rows[0];
};

exports.deleteVariant = async (variantId) => {
    await pool.query(
        `
        DELETE FROM product_variants
        WHERE variant_id = $1
    `,
        [variantId],
    );
};

exports.findByCode = async (code) => {
    const result = await pool.query(
        `
        SELECT
            product_id,
            code
        FROM products
        WHERE code = $1
    `,
        [code],
    );

    return result.rows[0];
};

exports.findAllAdmin = async () => {
    const result = await pool.query(`
        SELECT
            p.product_id,
            p.code,
            p.name,
            p.price,
            p.description,
            p.image_path,
            p.status,
            c.name AS category_name,
            COALESCE(SUM(v.stock), 0) AS stock
        FROM products p
        JOIN categories c
            ON p.category_id = c.category_id
        LEFT JOIN product_variants v
            ON p.product_id = v.product_id
        GROUP BY
            p.product_id,
            c.name
        ORDER BY p.product_id DESC
    `);

    return result.rows;
};

exports.findActiveVariant = async (variantId) => {
    const result = await pool.query(
        `
        SELECT
            v.variant_id,
            v.product_id,
            v.stock,
            p.status
        FROM product_variants v
        JOIN products p
            ON v.product_id = p.product_id
        WHERE v.variant_id = $1
          AND p.status = 'ACTIVE'
    `,
        [variantId],
    );

    return result.rows[0];
};
