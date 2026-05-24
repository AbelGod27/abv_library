/**
 * Script para poblar lib_venta y lib_pres con stock para TODOS los libros
 * que existan en la tabla libro.
 * 
 * Ejecutar: node bd/seed_stock.js
 * 
 * - lib_venta: stock disponible para venta (id_venta = NULL)
 * - lib_pres: stock disponible para préstamo (id_prestamo = NULL)
 * 
 * Si un libro ya tiene stock (registro con id_venta/id_prestamo NULL),
 * se omite para no duplicar.
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Configuración de stock
const STOCK_VENTA_MIN = 5;
const STOCK_VENTA_MAX = 50;
const STOCK_PRESTAMO_MIN = 2;
const STOCK_PRESTAMO_MAX = 15;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║  POBLAR STOCK: lib_venta y lib_pres         ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    // Obtener todos los libros
    const librosResult = await pool.query("SELECT isbn FROM libro ORDER BY isbn");
    const libros = librosResult.rows;

    console.log(`Total de libros en la base: ${libros.length}\n`);

    if (libros.length === 0) {
        console.log("No hay libros en la base. Ejecuta primero el seed de libros.");
        await pool.end();
        return;
    }

    let ventasInsertadas = 0;
    let ventasOmitidas = 0;
    let prestamosInsertados = 0;
    let prestamosOmitidos = 0;

    // Procesar en lotes de 100 para eficiencia
    const BATCH_SIZE = 100;

    for (let i = 0; i < libros.length; i += BATCH_SIZE) {
        const lote = libros.slice(i, i + BATCH_SIZE);

        await pool.query("BEGIN");

        for (const libro of lote) {
            const isbn = libro.isbn;

            // === lib_venta ===
            const existeVenta = await pool.query(
                "SELECT 1 FROM lib_venta WHERE isbn = $1 AND id_venta IS NULL",
                [isbn]
            );

            if (existeVenta.rows.length === 0) {
                const cantidadVenta = randomInt(STOCK_VENTA_MIN, STOCK_VENTA_MAX);
                await pool.query(
                    "INSERT INTO lib_venta (cantidad, id_venta, isbn) VALUES ($1, NULL, $2)",
                    [cantidadVenta, isbn]
                );
                ventasInsertadas++;
            } else {
                ventasOmitidas++;
            }

            // === lib_pres ===
            const existePrestamo = await pool.query(
                "SELECT 1 FROM lib_pres WHERE isbn = $1 AND id_prestamo IS NULL",
                [isbn]
            );

            if (existePrestamo.rows.length === 0) {
                const cantidadPrestamo = randomInt(STOCK_PRESTAMO_MIN, STOCK_PRESTAMO_MAX);
                await pool.query(
                    "INSERT INTO lib_pres (cantidad, id_prestamo, isbn) VALUES ($1, NULL, $2)",
                    [cantidadPrestamo, isbn]
                );
                prestamosInsertados++;
            } else {
                prestamosOmitidos++;
            }
        }

        await pool.query("COMMIT");

        const progreso = Math.min(i + BATCH_SIZE, libros.length);
        console.log(`  Procesados: ${progreso}/${libros.length}`);
    }

    console.log("\n╔══════════════════════════════════════════════╗");
    console.log(`║  ✅ RESULTADO                                ║`);
    console.log(`║                                              ║`);
    console.log(`║  lib_venta:                                  ║`);
    console.log(`║    Insertados: ${String(ventasInsertadas).padEnd(30)}║`);
    console.log(`║    Omitidos (ya tenían stock): ${String(ventasOmitidas).padEnd(14)}║`);
    console.log(`║    Stock por libro: ${STOCK_VENTA_MIN}-${STOCK_VENTA_MAX} unidades`.padEnd(47) + "║");
    console.log(`║                                              ║`);
    console.log(`║  lib_pres:                                   ║`);
    console.log(`║    Insertados: ${String(prestamosInsertados).padEnd(30)}║`);
    console.log(`║    Omitidos (ya tenían stock): ${String(prestamosOmitidos).padEnd(14)}║`);
    console.log(`║    Stock por libro: ${STOCK_PRESTAMO_MIN}-${STOCK_PRESTAMO_MAX} unidades`.padEnd(47) + "║");
    console.log("╚══════════════════════════════════════════════╝");

    await pool.end();
    console.log("\nConexión cerrada. ¡Listo!");
}

main().catch(err => {
    console.error("Error fatal:", err);
    pool.end();
    process.exit(1);
});
