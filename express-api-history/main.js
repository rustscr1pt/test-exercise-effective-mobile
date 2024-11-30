const express = require("express");
const { Pool } = require("pg");
const app = express();

const pool = new Pool({
    user: "myuser",
    host: "db",
    database: "history_service",
    password: "mypassword",
    port: 5432,
});

// Middleware для обработки JSON
app.use(express.json());

// Endpoint для получения истории с фильтрацией
app.get("/history", async (req, res) => {
    const { shop_id, plu, start_date, end_date, action, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let filters = [];
    let values = [];

    if (shop_id) {
        filters.push("shop_id = $1");
        values.push(shop_id);
    }
    if (plu) {
        filters.push("plu = $2");
        values.push(plu);
    }
    if (start_date) {
        filters.push("created_at >= $3");
        values.push(start_date);
    }
    if (end_date) {
        filters.push("created_at <= $4");
        values.push(end_date);
    }
    if (action) {
        filters.push("action = $5");
        values.push(action);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    try {
        const { rows } = await pool.query(
            `SELECT * FROM action_history
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $6 OFFSET $7`,
            [...values, limit, offset]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка сервера");
    }
});

const port = process.env.DEPLOY_PORT || 8004;

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
