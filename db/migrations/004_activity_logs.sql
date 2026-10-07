BEGIN;

CREATE TABLE IF NOT EXISTS activity_logs (
    log_id BIGSERIAL PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_type VARCHAR(16) NOT NULL CHECK (actor_type IN ('admin', 'user', 'anonymous')),
    actor_user_id INTEGER REFERENCES users (user_id) ON DELETE SET NULL,
    actor_admin_id INTEGER REFERENCES admins (admin_id) ON DELETE SET NULL,
    actor_username VARCHAR(100) NOT NULL DEFAULT 'anonymous',
    actor_role VARCHAR(50),
    event_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    http_method VARCHAR(10),
    request_path VARCHAR(500),
    outcome VARCHAR(16) NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent VARCHAR(512)
);

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(50);

CREATE INDEX IF NOT EXISTS activity_logs_occurred_at_idx
    ON activity_logs (occurred_at DESC, log_id DESC);
CREATE INDEX IF NOT EXISTS activity_logs_actor_username_idx
    ON activity_logs (actor_username, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_event_type_idx
    ON activity_logs (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_outcome_idx
    ON activity_logs (outcome, occurred_at DESC);

INSERT INTO permissions (name, description, is_system)
VALUES ('logs.read', 'View and search system activity logs', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permission_routes (permission_id, http_method, route_path, description)
SELECT permission_id, 'GET', '/admin/logs', 'View and search system activity logs'
FROM permissions
WHERE name = 'logs.read'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN' AND p.name = 'logs.read'
ON CONFLICT DO NOTHING;

COMMIT;
