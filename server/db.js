const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "secureci",
    password: process.env.DB_PASSWORD || "secureci_dev",
    database: process.env.DB_NAME || "secureci",
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL error:", err);
});

module.exports = pool;