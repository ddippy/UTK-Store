BEGIN;

CREATE TABLE IF NOT EXISTS file_metadata (
    file_id BIGSERIAL PRIMARY KEY,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    resource_type VARCHAR(32) NOT NULL CHECK (resource_type IN ('payment_slip', 'product_image')),
    order_id INTEGER REFERENCES orders (order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products (product_id) ON DELETE CASCADE,
    uploaded_by_user_id INTEGER REFERENCES users (user_id) ON DELETE SET NULL,
    uploaded_by_admin_id INTEGER REFERENCES admins (admin_id) ON DELETE SET NULL,
    uploader_type VARCHAR(16) NOT NULL CHECK (uploader_type IN ('user', 'admin')),
    uploader_username VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT file_metadata_resource_check CHECK (
        (resource_type = 'payment_slip' AND order_id IS NOT NULL AND product_id IS NULL)
        OR
        (resource_type = 'product_image' AND product_id IS NOT NULL AND order_id IS NULL)
    ),
    CONSTRAINT file_metadata_uploader_check CHECK (
        num_nonnulls(uploaded_by_user_id, uploaded_by_admin_id) <= 1
    )
);

CREATE INDEX IF NOT EXISTS file_metadata_order_idx
    ON file_metadata (order_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS file_metadata_product_idx
    ON file_metadata (product_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS file_metadata_uploader_user_idx
    ON file_metadata (uploaded_by_user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS file_metadata_uploader_admin_idx
    ON file_metadata (uploaded_by_admin_id, uploaded_at DESC);

COMMIT;
