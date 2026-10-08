BEGIN;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('MANAGER', 'STAFF')
  AND p.name = 'orders.own.read'
ON CONFLICT DO NOTHING;

COMMIT;
