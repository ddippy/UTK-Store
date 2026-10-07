BEGIN;

INSERT INTO permissions (name, description, is_system)
VALUES
    ('payment_slips.read', 'ดูหลักฐานชำระเงินของคำสั่งซื้อทั้งหมด', TRUE),
    ('payment_slips.own.read', 'ดูหลักฐานชำระเงินของตนเอง', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permission_routes (permission_id, http_method, route_path, description)
SELECT p.permission_id, v.http_method, v.route_path, v.description
FROM (VALUES
    ('payment_slips.own.read', 'GET', '/orders/:id/payment-slip', 'ดูสลิปของตนเอง'),
    ('payment_slips.read', 'GET', '/orders/:id/payment-slip', 'ดูสลิปสำหรับเจ้าหน้าที่')
) AS v(permission_name, http_method, route_path, description)
JOIN permissions p ON p.name = v.permission_name
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r CROSS JOIN permissions p
WHERE (r.name IN ('MANAGER', 'STAFF') AND p.name = 'payment_slips.read')
   OR (r.name = 'USER' AND p.name = 'payment_slips.own.read')
   OR (r.name = 'ADMIN' AND p.name IN ('payment_slips.read', 'payment_slips.own.read'))
ON CONFLICT DO NOTHING;

COMMIT;
