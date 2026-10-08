const pool = require("../db/pool");

const cleanFilename = (filename) =>
    String(filename || "unknown")
        .replace(/[\\/\u0000-\u001f]/g, "_")
        .slice(0, 255);

exports.insert = async (executor = pool, { file, resourceType, resourceId, req }) => {
    const isAdmin = Boolean(req.session.adminId);
    const uploaderId = isAdmin ? req.session.adminId : req.session.userId;
    const uploaderUsername = isAdmin
        ? req.session.adminUsername
        : req.session.username;

    if (!uploaderId) {
        throw new Error("Cannot store file metadata without an authenticated uploader");
    }

    const orderId = resourceType === "payment_slip" ? resourceId : null;
    const productId = resourceType === "product_image" ? resourceId : null;

    await executor.query(
        `
            INSERT INTO file_metadata (
                stored_filename,
                original_filename,
                mime_type,
                size_bytes,
                resource_type,
                order_id,
                product_id,
                uploaded_by_user_id,
                uploaded_by_admin_id,
                uploader_type,
                uploader_username
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
            cleanFilename(file.filename),
            cleanFilename(file.originalname),
            file.detectedMimeType,
            file.size,
            resourceType,
            orderId,
            productId,
            isAdmin ? null : uploaderId,
            isAdmin ? uploaderId : null,
            isAdmin ? "admin" : "user",
            String(uploaderUsername || "unknown").slice(0, 100),
        ],
    );
};
