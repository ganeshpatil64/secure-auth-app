const { Pool } = require('pg');

// This automatically reads your .env file credentials
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD), // Ensures password is read as a string
    port: process.env.DB_PORT,
});

module.exports = {
    // This query wrapper forces us to use parameterized queries, preventing SQL Injection
    query: (text, params) => pool.query(text, params),
};