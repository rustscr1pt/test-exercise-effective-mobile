const express = require("express");
const extractPool = require('./postgres_pool');
const app = express();

// Setup PostgreSQL connection
const pool = extractPool();

// Middleware for JSON parsing
app.use(express.json());

// POST Endpoint to log actions
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

// GET Endpoint to retrieve history with filtering and pagination
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
             LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
            [...values, limit, offset]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Set the port for the history service
const port = process.env.DEPLOY_PORT || 8002;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
