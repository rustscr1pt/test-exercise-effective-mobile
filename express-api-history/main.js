const express = require("express");
const extractPool = require('./postgres_pool');
const app = express();
const pool = extractPool();

// Middleware for JSON parsing
app.use(express.json());

/**
 * POST => /history
 * Записывает лог в бд о событии, которое только что произошло. Записывает в таблицу action_history
 * {
 *   "action": "string",       // выполненное действие
 *   "shop_id": "integer",     // ID магазина
 *   "plu": "integer",         // plu (код товара)
 *   "details": "object"       // больше деталей о произошелшем действии
 * }
 */
app.post("/history", async (req, res) => {
    const { action, shop_id, plu, details } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO action_history (action, shop_id, plu, action_details, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
            [action, shop_id || null, plu, JSON.stringify(details)] // Correct column name `action_details`
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error logging action" });
    }
});

/**
 * GET => /history
 * Получает логи из таблицы action_history с возможностью фильтрации по критериям и пагинацией
 * Дополнительные параметры : shop_id, plu, start_date, end_date, action, page, limit
 * Параметры передаются через Query Params
 */
app.get("/history", async (req, res) => {
    const { shop_id, plu, start_date, end_date, action, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let filters = [];
    let values = [];

    if (shop_id) { //
        filters.push(`shop_id = $${values.length + 1}`);
        values.push(Number(shop_id)); // Explicit type conversion
    }
    if (plu) { //
        filters.push(`plu = $${values.length + 1}`);
        values.push(Number(plu));
    }
    if (start_date) { //
        filters.push(`created_at >= $${values.length + 1}`);
        values.push(start_date);
    }
    if (end_date) { //
        filters.push(`created_at <= $${values.length + 1}`);
        values.push(end_date);
    }
    if (action) { //
        filters.push(`action = $${values.length + 1}`);
        values.push(action);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    try {
        const { rows } = await pool.query(
            `SELECT * FROM action_history
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
            [...values, limit, offset] // Append limit and offset at the end
        );
        res.json(rows);
    } catch (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Server error");
    }
});
const port = process.env.DEPLOY_PORT || 8002;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
