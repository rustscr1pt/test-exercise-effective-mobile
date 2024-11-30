const express = require('express');
const bodyParser = require('body-parser');
const extractPool = require('./postgres_pool');

const app = express();
app.use(bodyParser.json());

// Настройка подключения к PostgreSQL
const pool = extractPool();

// Endpoint: Создание товара
app.post('/products', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query('INSERT INTO products (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint: Создание остатка
app.post('/inventory', async (req, res) => {
    const { plu, store_id, stock_quantity, order_quantity } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO inventory (plu, store_id, stock_quantity, order_quantity) VALUES ($1, $2, $3, $4) RETURNING *',
            [plu, store_id, stock_quantity, order_quantity]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint: Увеличение остатка
app.patch('/inventory/increase', async (req, res) => {
    const { inventory_id, amount } = req.body;
    try {
        const result = await pool.query(
            'UPDATE inventory SET stock_quantity = stock_quantity + $1 WHERE inventory_id = $2 RETURNING *',
            [amount, inventory_id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint: Уменьшение остатка
app.patch('/inventory/decrease', async (req, res) => {
    const { inventory_id, amount } = req.body;
    try {
        const result = await pool.query(
            'UPDATE inventory SET stock_quantity = stock_quantity - $1 WHERE inventory_id = $2 RETURNING *',
            [amount, inventory_id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint: Получение остатков по фильтрам
app.get('/inventory', async (req, res) => {
    const { plu, shop_id, stock_min, stock_max, order_min, order_max } = req.query;
    let query = 'SELECT * FROM inventory WHERE true';
    const params = [];
    if (plu) {
        params.push(plu);
        query += ` AND plu = $${params.length}`;
    }
    if (shop_id) {
        params.push(shop_id);
        query += ` AND store_id = $${params.length}`;
    }
    if (stock_min) {
        params.push(stock_min);
        query += ` AND stock_quantity >= $${params.length}`;
    }
    if (stock_max) {
        params.push(stock_max);
        query += ` AND stock_quantity <= $${params.length}`;
    }
    if (order_min) {
        params.push(order_min);
        query += ` AND order_quantity >= $${params.length}`;
    }
    if (order_max) {
        params.push(order_max);
        query += ` AND order_quantity <= $${params.length}`;
    }
    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint: Получение товаров по фильтрам
app.get('/products', async (req, res) => {
    const { name, plu } = req.query;
    let query = 'SELECT * FROM products WHERE true';
    const params = [];
    if (name) {
        params.push(`%${name}%`);
        query += ` AND name ILIKE $${params.length}`;
    }
    if (plu) {
        params.push(plu);
        query += ` AND plu = $${params.length}`;
    }
    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Запуск сервера
const port = process.env.DEPLOY_PORT || 8003;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
