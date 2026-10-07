BEGIN;

CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description, is_system)
VALUES
    ('ADMIN', 'ผู้ดูแลระบบ มีสิทธิ์ดูแลระบบทั้งหมด', TRUE),
    ('USER', 'ผู้ใช้ทั่วไป', TRUE),
    ('STAFF', 'เจ้าหน้าที่ร้านค้า', TRUE),
    ('MANAGER', 'ผู้จัดการร้านค้า', TRUE)
ON CONFLICT (name) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS roles_name_lower_unique_idx
    ON roles (LOWER(name));

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role_id INTEGER;

UPDATE users AS u
SET role_id = r.role_id
FROM roles AS r
WHERE u.role_id IS NULL
  AND r.name = UPPER(COALESCE(u.role, 'USER'));

UPDATE users
SET role_id = (SELECT role_id FROM roles WHERE name = 'USER')
WHERE role_id IS NULL;

UPDATE admins
SET role_id = (SELECT role_id FROM roles WHERE name = 'ADMIN')
WHERE role_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_role_id_fkey'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_role_id_fkey
            FOREIGN KEY (role_id) REFERENCES roles(role_id)
            ON UPDATE RESTRICT ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'admins_role_id_fkey'
          AND conrelid = 'admins'::regclass
    ) THEN
        ALTER TABLE admins
            ADD CONSTRAINT admins_role_id_fkey
            FOREIGN KEY (role_id) REFERENCES roles(role_id)
            ON UPDATE RESTRICT ON DELETE RESTRICT;
    END IF;
END $$;

ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE admins ALTER COLUMN role_id SET NOT NULL;

COMMIT;
