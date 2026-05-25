// Archivo: db.js — Configuración y conexión a la base de datos PostgreSQL
const { Pool } = require("pg");

// Crear pool de conexiones usando la URL de la base de datos desde variables de entorno
const db = new Pool({

    connectionString: process.env.DATABASE_URL,

    // Configuración SSL requerida para conexiones remotas (ej: Render, Railway)
    ssl: {
        rejectUnauthorized: false
    }

});

// Intentar conectar al iniciar la aplicación y confirmar en consola
db.connect()
    .then(() => {
        console.log("Conexión con PostgreSQL");
    })
    .catch(err => {
        console.error("Error PostgreSQL:", err);
    });

module.exports = db;
