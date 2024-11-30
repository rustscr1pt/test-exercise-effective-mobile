const {Pool} = require("pg");

/**
 * Настраиваем подключение к Postgres в другом контейнере
 * @returns {Pool} - готовый для использования Pool (Postgres)
 */
function extractPool() {
    return new Pool({
        user: 'myuser',
        host: 'db',
        database: 'mydatabase',
        password: 'mypassword',
        port: 5432,
    })
}

module.exports = extractPool;
