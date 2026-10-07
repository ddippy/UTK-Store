const pool = require("../db/pool");

const safeText = (value, maxLength) => {
    if (value === undefined || value === null) return null;
    return String(value).slice(0, maxLength);
};

exports.record = async (req, event) => {
    const session = req.session || {};
    const actorUserId = Object.hasOwn(event, "actorUserId") ? event.actorUserId : session.userId || null;
    const actorAdminId = Object.hasOwn(event, "actorAdminId") ? event.actorAdminId : session.adminId || null;
    const actorType = event.actorType || (actorAdminId ? "admin" : actorUserId ? "user" : "anonymous");
    const actorUsername =
        event.actorUsername ||
        (actorAdminId ? session.adminUsername : session.username) ||
        "anonymous";

    try {
        await pool.query(
            `
                INSERT INTO activity_logs (
                    actor_type,
                    actor_user_id,
                    actor_admin_id,
                    actor_username,
                    actor_role,
                    event_type,
                    resource_type,
                    resource_id,
                    http_method,
                    request_path,
                    outcome,
                    details,
                    ip_address,
                    user_agent
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                    $12::jsonb, $13::inet, $14
                )
            `,
            [
                actorType,
                actorUserId,
                actorAdminId,
                safeText(actorUsername, 100) || "anonymous",
                safeText(
                    Object.hasOwn(event, "actorRole")
                        ? event.actorRole
                        : session.role || (actorAdminId ? "ADMIN" : null),
                    50,
                ),
                safeText(event.eventType, 100),
                safeText(event.resourceType, 100) || "system",
                safeText(event.resourceId, 100),
                safeText(req.method, 10),
                safeText(req.originalUrl?.split("?")[0] || req.path, 500),
                event.outcome || "success",
                JSON.stringify(event.details || {}),
                safeText(req.ip, 45),
                safeText(req.get?.("user-agent"), 512),
            ],
        );
    } catch (error) {
        // Logging failures must not expose credentials or stop the requested operation.
        console.error("[activity-log] บันทึกเหตุการณ์ไม่สำเร็จ:", error.message);
    }
};

exports.findPage = async ({ filters, page, pageSize }) => {
    const normalizedPageSize =
        Number.isSafeInteger(Number(pageSize)) && Number(pageSize) > 0 ? Number(pageSize) : 50;
    const normalizedPage =
        Number.isSafeInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const conditions = [];
    const values = [];
    const addCondition = (sql, value) => {
        values.push(value);
        conditions.push(sql.replace("?", () => `$${values.length}`));
    };

    if (filters.from) addCondition("occurred_at >= ?::date", filters.from);
    if (filters.to) addCondition("occurred_at < (?::date + INTERVAL '1 day')", filters.to);
    if (filters.username) addCondition("actor_username ILIKE ?", `%${filters.username}%`);
    if (filters.eventType) addCondition("event_type = ?", filters.eventType);
    if (filters.outcome) addCondition("outcome = ?", filters.outcome);

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await pool.query(
        `SELECT COUNT(*)::INTEGER AS total FROM activity_logs ${whereClause}`,
        values,
    );
    const total = Number(countResult.rows[0].total) || 0;
    const pageCount = Math.max(1, Math.ceil(total / normalizedPageSize));
    const currentPage = Math.min(normalizedPage, pageCount);
    const offset = (currentPage - 1) * normalizedPageSize;
    const result = await pool.query(
        `
            SELECT log_id, occurred_at, actor_type, actor_username, actor_role, event_type,
                   resource_type, resource_id, http_method, request_path,
                   outcome, details, ip_address
            FROM activity_logs
            ${whereClause}
            ORDER BY occurred_at DESC, log_id DESC
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `,
        [...values, normalizedPageSize, offset],
    );

    return { rows: result.rows, total, page: currentPage };
};
