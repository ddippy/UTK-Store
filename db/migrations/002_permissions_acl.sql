BEGIN;

CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL DEFAULT '',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_lower_unique_idx ON permissions (LOWER(name));

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles (role_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions (permission_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS permission_routes (
    permission_id INTEGER NOT NULL REFERENCES permissions (permission_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    http_method VARCHAR(10) NOT NULL,
    route_path VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL DEFAULT '',
    PRIMARY KEY (permission_id, http_method, route_path),
    UNIQUE (http_method, route_path, permission_id)
);

INSERT INTO
    permissions (name, description, is_system)
VALUES
    (
        'dashboard.read',
        'ดู Dashboard และภาพรวมยอดขาย',
        TRUE
    ),
    (
        'products.read',
        'ดูรายการสินค้าในระบบ Admin',
        TRUE
    ),
    ('products.create', 'เพิ่มสินค้า', TRUE),
    (
        'products.update',
        'แก้ไขสินค้าและสถานะสินค้า',
        TRUE
    ),
    (
        'variants.manage',
        'จัดการ Variant และสต็อกสินค้า',
        TRUE
    ),
    ('orders.read', 'ดูคำสั่งซื้อทั้งหมด', TRUE),
    ('orders.update', 'เปลี่ยนสถานะคำสั่งซื้อ', TRUE),
    ('orders.own.read', 'ดูคำสั่งซื้อของตนเอง', TRUE),
    (
        'orders.own.create',
        'สั่งซื้อและแนบหลักฐานชำระเงิน',
        TRUE
    ),
    (
        'payment_slips.read',
        'ดูหลักฐานชำระเงินของคำสั่งซื้อทั้งหมด',
        TRUE
    ),
    (
        'payment_slips.own.read',
        'ดูหลักฐานชำระเงินของตนเอง',
        TRUE
    ),
    ('cart.manage', 'จัดการตะกร้าสินค้าของตนเอง', TRUE),
    ('roles.manage', 'จัดการ Role', TRUE),
    ('users.manage', 'ดูผู้ใช้และกำหนด Role', TRUE),
    ('permissions.manage', 'จัดการ Permission', TRUE),
    ('acl.manage', 'กำหนด Permission ให้ Role', TRUE) ON CONFLICT (name) DO NOTHING;

-- ADMIN เริ่มต้นมีทุก Permission รวมถึง Permission ที่เพิ่มในอนาคต
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT
    r.role_id,
    p.permission_id
FROM
    roles r
    CROSS JOIN permissions p
WHERE
    r.name = 'ADMIN' ON CONFLICT DO NOTHING;

-- Each supported endpoint is tied to its permission in the database.
INSERT INTO
    permission_routes (
        permission_id,
        http_method,
        route_path,
        description
    )
SELECT
    p.permission_id,
    v.http_method,
    v.route_path,
    v.description
FROM
    (
        VALUES
            (
                'dashboard.read',
                'GET',
                '/admin',
                'หน้า Dashboard'
            ),
            (
                'products.read',
                'GET',
                '/admin/products',
                'รายการสินค้าใน Admin'
            ),
            (
                'orders.read',
                'GET',
                '/admin/orders',
                'รายการคำสั่งซื้อ'
            ),
            (
                'products.create',
                'GET',
                '/admin/products/create',
                'แบบฟอร์มเพิ่มสินค้า'
            ),
            (
                'products.read',
                'GET',
                '/admin/products/:id/variants',
                'ดู Variant สินค้า'
            ),
            (
                'products.read',
                'GET',
                '/admin/products/:id/edit',
                'แบบฟอร์มแก้ไขสินค้า'
            ),
            (
                'products.create',
                'POST',
                '/admin/products/create',
                'เพิ่มสินค้า'
            ),
            (
                'variants.manage',
                'POST',
                '/admin/products/:id/variants',
                'เพิ่ม Variant'
            ),
            (
                'products.update',
                'POST',
                '/admin/products/:id/edit',
                'แก้ไขสินค้า'
            ),
            (
                'products.update',
                'POST',
                '/admin/products/:id/status',
                'เปลี่ยนสถานะสินค้า'
            ),
            (
                'variants.manage',
                'POST',
                '/admin/products/:id/variants/:variantId/edit',
                'แก้ไข Variant และสต็อก'
            ),
            (
                'variants.manage',
                'POST',
                '/admin/products/:id/variants/:variantId/delete',
                'ลบ Variant'
            ),
            (
                'orders.update',
                'POST',
                '/admin/orders/:id/status',
                'เปลี่ยนสถานะคำสั่งซื้อ'
            ),
            (
                'roles.manage',
                'GET',
                '/admin/roles',
                'หน้า Role'
            ),
            (
                'roles.manage',
                'POST',
                '/admin/roles',
                'เพิ่ม Role'
            ),
            (
                'roles.manage',
                'POST',
                '/admin/roles/:id/edit',
                'แก้ไข Role'
            ),
            (
                'roles.manage',
                'POST',
                '/admin/roles/:id/delete',
                'ลบ Role'
            ),
            (
                'users.manage',
                'GET',
                '/admin/users',
                'หน้าจัดการผู้ใช้'
            ),
            (
                'users.manage',
                'POST',
                '/admin/users/:id/role',
                'กำหนด Role ผู้ใช้'
            ),
            (
                'permissions.manage',
                'GET',
                '/admin/permissions',
                'หน้าจัดการ Permission'
            ),
            (
                'permissions.manage',
                'POST',
                '/admin/permissions',
                'เพิ่ม Permission'
            ),
            (
                'permissions.manage',
                'POST',
                '/admin/permissions/:id/edit',
                'แก้ไข Permission'
            ),
            (
                'permissions.manage',
                'POST',
                '/admin/permissions/:id/delete',
                'ลบ Permission'
            ),
            (
                'acl.manage',
                'GET',
                '/admin/acl',
                'ตาราง Role × Permission'
            ),
            (
                'acl.manage',
                'POST',
                '/admin/acl/:roleId/:permissionId',
                'กำหนด Permission ให้ Role'
            ),
            ('cart.manage', 'GET', '/cart', 'ดูตะกร้า'),
            (
                'cart.manage',
                'POST',
                '/cart/add',
                'เพิ่มสินค้าลงตะกร้า'
            ),
            (
                'cart.manage',
                'POST',
                '/cart/remove',
                'นำสินค้าออกจากตะกร้า'
            ),
            (
                'cart.manage',
                'POST',
                '/cart/update',
                'แก้จำนวนสินค้าในตะกร้า'
            ),
            (
                'orders.own.create',
                'GET',
                '/orders/checkout',
                'หน้า Checkout'
            ),
            (
                'orders.own.read',
                'GET',
                '/orders/my-orders',
                'ประวัติคำสั่งซื้อของตนเอง'
            ),
            (
                'orders.own.read',
                'GET',
                '/orders/:id',
                'รายละเอียดคำสั่งซื้อ'
            ),
            (
                'orders.read',
                'GET',
                '/orders/:id',
                'รายละเอียดคำสั่งซื้อสำหรับเจ้าหน้าที่'
            ),
            (
                'payment_slips.own.read',
                'GET',
                '/orders/:id/payment-slip',
                'ดูสลิปของตนเอง'
            ),
            (
                'payment_slips.read',
                'GET',
                '/orders/:id/payment-slip',
                'ดูสลิปสำหรับเจ้าหน้าที่'
            ),
            (
                'orders.own.create',
                'POST',
                '/orders/create',
                'สร้างคำสั่งซื้อและส่งสลิป'
            )
    ) AS v (
        permission_name,
        http_method,
        route_path,
        description
    )
    JOIN permissions p ON p.name = v.permission_name ON CONFLICT DO NOTHING;

-- MANAGER ดูภาพรวมและดำเนินงานร้านค้าได้
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT
    r.role_id,
    p.permission_id
FROM
    roles r
    CROSS JOIN permissions p
WHERE
    r.name = 'MANAGER'
    AND p.name IN (
        'dashboard.read',
        'products.read',
        'products.create',
        'products.update',
        'variants.manage',
        'orders.read',
        'orders.update',
        'orders.own.read',
        'payment_slips.read'
    ) ON CONFLICT DO NOTHING;

-- STAFF จัดการสินค้า/สต็อกและคำสั่งซื้อ แต่ไม่เข้าถึง Dashboard หรือการตั้งค่าสิทธิ์
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT
    r.role_id,
    p.permission_id
FROM
    roles r
    CROSS JOIN permissions p
WHERE
    r.name = 'STAFF'
    AND p.name IN (
        'products.read',
        'variants.manage',
        'orders.read',
        'orders.update',
        'orders.own.read',
        'payment_slips.read'
    ) ON CONFLICT DO NOTHING;

-- USER ใช้ร้านค้า ตะกร้า และคำสั่งซื้อของตนเอง
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT
    r.role_id,
    p.permission_id
FROM
    roles r
    CROSS JOIN permissions p
WHERE
    r.name = 'USER'
    AND p.name IN (
        'cart.manage',
        'orders.own.read',
        'orders.own.create',
        'payment_slips.own.read'
    ) ON CONFLICT DO NOTHING;

COMMIT;
