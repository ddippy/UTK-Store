-- UTK-Store clean demo data; run after db/schema.sql on an empty database.
-- Demo logins: student01/user123, admin/admin123, staff/staff123, manager/manager123.
SET client_encoding = 'UTF8';
BEGIN;

-- Roles
INSERT INTO roles (name, description, is_system) VALUES
    ('ADMIN', 'ผู้ดูแลระบบ มีสิทธิ์ดูแลระบบทั้งหมด', TRUE),
    ('USER', 'ผู้ใช้ทั่วไป', TRUE),
    ('STAFF', 'เจ้าหน้าที่ร้านค้า', TRUE),
    ('MANAGER', 'ผู้จัดการร้านค้า', TRUE)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

-- Permissions
INSERT INTO permissions (name, description, is_system) VALUES
    ('dashboard.read', 'ดู Dashboard และภาพรวมยอดขาย', TRUE),
    ('products.read', 'ดูรายการสินค้าในระบบ Admin', TRUE),
    ('products.create', 'เพิ่มสินค้า', TRUE),
    ('products.update', 'แก้ไขสินค้าและสถานะสินค้า', TRUE),
    ('variants.manage', 'จัดการ Variant และสต็อกสินค้า', TRUE),
    ('orders.read', 'ดูคำสั่งซื้อทั้งหมด', TRUE),
    ('orders.update', 'เปลี่ยนสถานะคำสั่งซื้อ', TRUE),
    ('orders.own.read', 'ดูคำสั่งซื้อของตนเอง', TRUE),
    ('orders.own.create', 'สั่งซื้อและแนบหลักฐานชำระเงิน', TRUE),
    ('cart.manage', 'จัดการตะกร้าสินค้าของตนเอง', TRUE),
    ('roles.manage', 'จัดการ Role', TRUE),
    ('users.manage', 'ดูผู้ใช้และกำหนด Role', TRUE),
    ('permissions.manage', 'จัดการ Permission', TRUE),
    ('acl.manage', 'กำหนด Permission ให้ Role', TRUE),
    ('payment_slips.read', 'ดูหลักฐานชำระเงินของคำสั่งซื้อทั้งหมด', TRUE),
    ('payment_slips.own.read', 'ดูหลักฐานชำระเงินของตนเอง', TRUE),
    ('logs.read', 'View and search system activity logs', TRUE),
    ('categories.manage', 'Manage product categories', TRUE)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, is_system = EXCLUDED.is_system;

-- Permission to route mappings
INSERT INTO permission_routes (permission_id, http_method, route_path, description)
SELECT p.permission_id, v.http_method, v.route_path, v.description
FROM (VALUES
    ('acl.manage', 'GET', '/admin/acl', 'ตาราง Role × Permission'),
    ('acl.manage', 'POST', '/admin/acl/:roleId/:permissionId', 'กำหนด Permission ให้ Role'),
    ('cart.manage', 'GET', '/cart', 'ดูตะกร้า'),
    ('cart.manage', 'POST', '/cart/add', 'เพิ่มสินค้าลงตะกร้า'),
    ('cart.manage', 'POST', '/cart/remove', 'นำสินค้าออกจากตะกร้า'),
    ('cart.manage', 'POST', '/cart/update', 'แก้จำนวนสินค้าในตะกร้า'),
    ('categories.manage', 'GET', '/admin/categories', 'Manage categories page'),
    ('categories.manage', 'POST', '/admin/categories', 'Create a category'),
    ('categories.manage', 'POST', '/admin/categories/:id/delete', 'Delete a category'),
    ('categories.manage', 'POST', '/admin/categories/:id/edit', 'Rename a category'),
    ('dashboard.read', 'GET', '/admin', 'หน้า Dashboard'),
    ('logs.read', 'GET', '/admin/logs', 'View and search system activity logs'),
    ('orders.own.create', 'GET', '/orders/checkout', 'หน้า Checkout'),
    ('orders.own.create', 'POST', '/orders/create', 'สร้างคำสั่งซื้อและส่งสลิป'),
    ('orders.own.read', 'GET', '/orders/:id', 'รายละเอียดคำสั่งซื้อ'),
    ('orders.own.read', 'GET', '/orders/my-orders', 'ประวัติคำสั่งซื้อของตนเอง'),
    ('orders.read', 'GET', '/admin/orders', 'รายการคำสั่งซื้อ'),
    ('orders.read', 'GET', '/orders/:id', 'รายละเอียดคำสั่งซื้อสำหรับเจ้าหน้าที่'),
    ('orders.update', 'POST', '/admin/orders/:id/status', 'เปลี่ยนสถานะคำสั่งซื้อ'),
    ('payment_slips.own.read', 'GET', '/orders/:id/payment-slip', 'ดูสลิปของตนเอง'),
    ('payment_slips.read', 'GET', '/orders/:id/payment-slip', 'ดูสลิปสำหรับเจ้าหน้าที่'),
    ('permissions.manage', 'GET', '/admin/permissions', 'หน้าจัดการ Permission'),
    ('permissions.manage', 'POST', '/admin/permissions', 'เพิ่ม Permission'),
    ('permissions.manage', 'POST', '/admin/permissions/:id/delete', 'ลบ Permission'),
    ('permissions.manage', 'POST', '/admin/permissions/:id/edit', 'แก้ไข Permission'),
    ('products.create', 'GET', '/admin/products/create', 'แบบฟอร์มเพิ่มสินค้า'),
    ('products.create', 'POST', '/admin/products/create', 'เพิ่มสินค้า'),
    ('products.read', 'GET', '/admin/products', 'รายการสินค้าใน Admin'),
    ('products.read', 'GET', '/admin/products/:id/edit', 'แบบฟอร์มแก้ไขสินค้า'),
    ('products.read', 'GET', '/admin/products/:id/variants', 'ดู Variant สินค้า'),
    ('products.update', 'POST', '/admin/products/:id/edit', 'แก้ไขสินค้า'),
    ('products.update', 'POST', '/admin/products/:id/status', 'เปลี่ยนสถานะสินค้า'),
    ('roles.manage', 'GET', '/admin/roles', 'หน้า Role'),
    ('roles.manage', 'POST', '/admin/roles', 'เพิ่ม Role'),
    ('roles.manage', 'POST', '/admin/roles/:id/delete', 'ลบ Role'),
    ('roles.manage', 'POST', '/admin/roles/:id/edit', 'แก้ไข Role'),
    ('users.manage', 'GET', '/admin/users', 'หน้าจัดการผู้ใช้'),
    ('users.manage', 'POST', '/admin/users/:id/role', 'กำหนด Role ผู้ใช้'),
    ('variants.manage', 'POST', '/admin/products/:id/variants', 'เพิ่ม Variant'),
    ('variants.manage', 'POST', '/admin/products/:id/variants/:variantId/delete', 'ลบ Variant'),
    ('variants.manage', 'POST', '/admin/products/:id/variants/:variantId/edit', 'แก้ไข Variant และสต็อก')
) AS v(permission_name, http_method, route_path, description)
JOIN permissions p ON p.name = v.permission_name
ON CONFLICT DO NOTHING;

-- Role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM (VALUES
    ('ADMIN', 'acl.manage'),
    ('ADMIN', 'cart.manage'),
    ('ADMIN', 'categories.manage'),
    ('ADMIN', 'dashboard.read'),
    ('ADMIN', 'logs.read'),
    ('ADMIN', 'orders.own.create'),
    ('ADMIN', 'orders.own.read'),
    ('ADMIN', 'orders.read'),
    ('ADMIN', 'orders.update'),
    ('ADMIN', 'payment_slips.own.read'),
    ('ADMIN', 'payment_slips.read'),
    ('ADMIN', 'permissions.manage'),
    ('ADMIN', 'products.create'),
    ('ADMIN', 'products.read'),
    ('ADMIN', 'products.update'),
    ('ADMIN', 'roles.manage'),
    ('ADMIN', 'users.manage'),
    ('ADMIN', 'variants.manage'),
    ('MANAGER', 'categories.manage'),
    ('MANAGER', 'dashboard.read'),
    ('MANAGER', 'orders.own.read'),
    ('MANAGER', 'orders.read'),
    ('MANAGER', 'orders.update'),
    ('MANAGER', 'payment_slips.read'),
    ('MANAGER', 'products.create'),
    ('MANAGER', 'products.read'),
    ('MANAGER', 'products.update'),
    ('MANAGER', 'variants.manage'),
    ('STAFF', 'orders.own.read'),
    ('STAFF', 'orders.read'),
    ('STAFF', 'orders.update'),
    ('STAFF', 'payment_slips.read'),
    ('STAFF', 'products.read'),
    ('STAFF', 'variants.manage'),
    ('USER', 'cart.manage'),
    ('USER', 'orders.own.create'),
    ('USER', 'orders.own.read'),
    ('USER', 'payment_slips.own.read')
) AS v(role_name, permission_name)
JOIN roles r ON r.name = v.role_name
JOIN permissions p ON p.name = v.permission_name
ON CONFLICT DO NOTHING;

-- Current categories
INSERT INTO categories (name) VALUES
    ('เสื้อผ้า'),
    ('เครื่องเขียน'),
    ('กระเป๋า'),
    ('ของใช้'),
    ('เครื่องใช้ไฟฟ้า')
ON CONFLICT (name) DO NOTHING;

-- Products currently marked ACTIVE in the source database
INSERT INTO products (code, name, category_id, price, description, image_path, status)
SELECT v.code, v.name, c.category_id, v.price, v.description, v.image_path, v.status
FROM (VALUES
    ('SH001', 'เสื้อโปโล RMUTK', 'เสื้อผ้า', 280.00, 'เสื้อโปโล RMUTK ลายใหม่
มี 3 สี', '/uploads/1790274493116-823201075.jpg', 'ACTIVE'),
    ('NB001', 'สมุดจนบันทึกสันห่วง B5', 'เครื่องเขียน', 59.00, 'สมุดจนบันทึกสันห่วง B5', '/uploads/1790276025803-463330298.jpg', 'ACTIVE'),
    ('BAG001', 'กระเป๋าสีดำ RMUTK', 'กระเป๋า', 199.00, 'กระเป๋าผ้าสีดำ RMUTK เก็บของได้เยอะ พกพาสะดวก', '/uploads/1790275769201-365277892.jpg', 'ACTIVE'),
    ('TMB001', 'แก้ว Energy Tumbler 16 oz', 'ของใช้', 199.00, 'แก้วเก็บความเย็น Energy Tumbler 16 oz ทำจากวัสดุอย่างดี ไม่เป็นสนิม เก็บความเย็นได้นาน', '/uploads/1790275398671-45782629.jpg', 'ACTIVE'),
    ('SH002', 'เสื้อ UNISEX JERSY RMUTK', 'เสื้อผ้า', 289.00, 'ดีไซน์เรียบสะอาด พร้อมกลิ่นอาย Y2K โทนครีมละมุนตา ตัดด้วยเขียวสด สื่อถึงพลังของวัยรุ่นยุคใหม่ที่มุ่งมั่นและมีสไตล์', '/uploads/1790275086771-316762563.jpg', 'ACTIVE'),
    ('BAG002', 'กระเป๋าโน๊ตบุ๊ค RMUTK', 'กระเป๋า', 299.00, 'กระเป๋าผ้าใส่โน๊ตบุ๊ค RMUTK อย่างดี ผ้าหนากันน้ำได้', '/uploads/1790275890287-88565715.jpg', 'ACTIVE'),
    ('PCL001', 'ดินสอ 2B', 'เครื่องเขียน', 20.00, 'ดินสอเขียนแบบ เหลาพร้อมใช้ ไส้ดินสอคุณภาพสูง เขียนได้คมชัด สามารถลบออกได้ง่าย ด้ามจับทรงหกเหลี่ยม จับถนัดมือ ด้ามสีน้ำเงิน ความเข้มไส้ดินสอ 2B', '/uploads/1790274193765-480073313.jpg', 'ACTIVE'),
    ('PCL002', 'ดินสอกด', 'เครื่องเขียน', 18.00, 'ดินสอกด Pentel Fiesta AX105 0.5 มม.', '/uploads/1790274073981-713126925.jpg', 'ACTIVE'),
    ('TMB003', 'แก้ว Kids Cooler Cup 12 oz', 'เครื่องใช้ไฟฟ้า', 300.00, 'testtest', '/uploads/product-1791459373329-da87cbb4-9817-4c3c-9b8a-2999b5616ea3.jpg', 'ACTIVE')
) AS v(code, name, category_name, price, description, image_path, status)
JOIN categories c ON c.name = v.category_name
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, category_id = EXCLUDED.category_id, price = EXCLUDED.price,
    description = EXCLUDED.description, image_path = EXCLUDED.image_path, status = EXCLUDED.status;

-- Variants and stock for the active products
INSERT INTO product_variants (product_id, size, color, stock)
SELECT p.product_id, v.size, v.color, v.stock
FROM (VALUES
    ('SH001', 'S', 'ดำ', 20),
    ('SH001', 'M', 'ดำ', 20),
    ('SH001', 'L', 'ดำ', 20),
    ('SH001', 'XL', 'ดำ', 14),
    ('SH001', 'S', 'กรม', 20),
    ('SH001', 'M', 'กรม', 20),
    ('SH001', 'L', 'กรม', 20),
    ('SH001', 'XL', 'กรม', 20),
    ('SH001', 'S', 'เทา', 20),
    ('SH001', 'M', 'เทา', 20),
    ('SH001', 'L', 'เทา', 20),
    ('SH001', 'XL', 'เทา', 20),
    ('NB001', NULL, 'ดำ-มีเส้น', 50),
    ('NB001', NULL, 'ดำ-ไม่มีเส้น', 50),
    ('BAG001', NULL, 'ดำ', 30),
    ('TMB001', NULL, 'เหลือง', 10),
    ('TMB001', NULL, 'แดง', 10),
    ('TMB001', NULL, 'เทา', 10),
    ('TMB001', NULL, 'ขาว', 10),
    ('SH002', 'S', NULL, 30),
    ('SH002', 'M', NULL, 30),
    ('SH002', 'L', NULL, 30),
    ('SH002', 'XL', NULL, 30),
    ('SH002', '2XL', NULL, 20),
    ('SH002', '3XL', NULL, 20),
    ('BAG002', NULL, 'สีดำ', 19),
    ('PCL001', NULL, NULL, 39),
    ('PCL002', NULL, 'คละสี', 26),
    ('TMB003', 'S', 'ขาว', 10)
) AS v(product_code, size, color, stock)
JOIN products p ON p.code = v.product_code
WHERE NOT EXISTS (
    SELECT 1 FROM product_variants existing
    WHERE existing.product_id = p.product_id
      AND existing.size IS NOT DISTINCT FROM v.size
      AND existing.color IS NOT DISTINCT FROM v.color
);

-- Demo accounts; STAFF and MANAGER are user accounts assigned through role_id.
INSERT INTO users (username, password_hash, name, student_id, phone, role, role_id)
VALUES
    ('student01', '$2b$10$x9ET1JuIspH2xXdzEFdpGuKAQrmDBNCJA0hOPKw48.3/lX/uphHHa', 'Test Student', 'TEST001', '0800000000', 'USER', (SELECT role_id FROM roles WHERE name = 'USER')),
    ('staff', '$2b$10$yVC2Uit/LOuX4aY9cqcCpeV82HOgQQDS6oL3wSleobQs9/Vk1ZM3e', 'ทดสอบ เจ้าหน้าที่ร้านค้า', '000', '000', 'USER', (SELECT role_id FROM roles WHERE name = 'STAFF')),
    ('manager', '$2b$10$t3vJ7Zql/Aa9RCYwmQFWEODM1X9HZ3wL.o/e2Hta0e.UmasYKylZm', 'ทดสอบ ผู้จัดการร้านค้า', '001', '000', 'USER', (SELECT role_id FROM roles WHERE name = 'MANAGER'))
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, student_id = EXCLUDED.student_id,
    phone = EXCLUDED.phone, role = EXCLUDED.role, role_id = EXCLUDED.role_id;

INSERT INTO admins (username, password_hash, role_id)
VALUES ('admin', '$2b$10$/9dMZ1vxz/sMy2PgwQ3DquAmq27yjR62oZSG4lo36b9VWeBJILWni', (SELECT role_id FROM roles WHERE name = 'ADMIN'))
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id;

COMMIT;
