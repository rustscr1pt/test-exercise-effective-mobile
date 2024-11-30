-- init.sql

-- Таблица товаров
CREATE TABLE products (
    plu SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Таблица магазинов
CREATE TABLE stores (
    store_id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL
);

-- Таблица остатков
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    plu INT NOT NULL REFERENCES products(plu) ON DELETE CASCADE,
    store_id INT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    stock_quantity INT NOT NULL DEFAULT 0,
    order_quantity INT NOT NULL DEFAULT 0,
    UNIQUE (plu, store_id)
);
