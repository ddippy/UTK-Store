BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_lower_unique_idx
    ON categories (LOWER(name));

INSERT INTO permissions (name, description, is_system)
VALUES ('categories.manage', 'Manage product categories', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permission_routes (permission_id, http_method, route_path, description)
SELECT p.permission_id, routes.http_method, routes.route_path, routes.description
FROM permissions p
CROSS JOIN (
    VALUES
        ('GET', '/admin/categories', 'Manage categories page'),
        ('POST', '/admin/categories', 'Create a category'),
        ('POST', '/admin/categories/:id/edit', 'Rename a category'),
        ('POST', '/admin/categories/:id/delete', 'Delete a category')
) AS routes(http_method, route_path, description)
WHERE p.name = 'categories.manage'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('ADMIN', 'MANAGER')
  AND p.name = 'categories.manage'
ON CONFLICT DO NOTHING;

COMMIT;
