require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const { Pool } = require("pg");

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
});

console.log("Conexión con PostgreSQL");

module.exports = db;