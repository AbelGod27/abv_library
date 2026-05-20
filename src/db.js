const { Pool } = require("pg");

const db = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }

});

db.connect()
    .then(() => {
        console.log("Conexión con PostgreSQL");
    })
    .catch(err => {
        console.error("Error PostgreSQL:", err);
    });

module.exports = db;