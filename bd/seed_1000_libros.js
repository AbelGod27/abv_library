/**
 * Script para importar ~1000 libros en español desde Open Library
 * Ejecutar: node bd/seed_1000_libros.js
 * 
 * Busca múltiples términos en español en Open Library y los inserta
 * en la base de datos local, omitiendo duplicados.
 */

require("dotenv").config();
const axios = require("axios");
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Términos de búsqueda variados para obtener libros en español
const TERMINOS = [
    "literatura española",
    "novela latinoamericana",
    "Gabriel García Márquez",
    "Jorge Luis Borges",
    "Isabel Allende",
    "Mario Vargas Llosa",
    "Carlos Fuentes",
    "Julio Cortázar",
    "Pablo Neruda",
    "Octavio Paz",
    "Miguel de Cervantes",
    "Federico García Lorca",
    "historia de México",
    "historia de España",
    "poesía española",
    "cuentos latinoamericanos",
    "filosofía en español",
    "ciencia ficción español",
    "Eduardo Galeano",
    "Roberto Bolaño",
    "Laura Esquivel",
    "Arturo Pérez-Reverte",
    "Rosa Montero",
    "Juan Rulfo",
    "Ernesto Sabato",
    "Horacio Quiroga",
    "Rubén Darío",
    "Antonio Machado",
    "Benito Pérez Galdós",
    "Camilo José Cela",
    "literatura infantil español",
    "cocina mexicana",
    "arte latinoamericano",
    "psicología español",
    "economía español",
    "derecho español",
    "medicina español",
    "educación español",
    "sociología latinoamérica",
    "política latinoamérica",
    "Sor Juana Inés de la Cruz",
    "Mario Benedetti",
    "Alfonsina Storni",
    "Gioconda Belli",
    "Elena Poniatowska",
    "Carlos Monsiváis",
    "Augusto Roa Bastos",
    "Alejo Carpentier",
    "José Saramago español",
    "teatro español"
];

async function buscarLibros(termino, offset = 0) {
    try {
        const response = await axios.get("https://openlibrary.org/search.json", {
            params: {
                q: termino,
                language: "spa",
                limit: 50,
                offset,
                fields: "title,author_name,first_publish_year,isbn,publisher"
            },
            timeout: 15000
        });
        return response.data.docs || [];
    } catch (error) {
        console.error(`  Error buscando "${termino}":`, error.message);
        return [];
    }
}

function generarPrecio() {
    // Precio aleatorio entre $49 y $599
    return (Math.random() * 550 + 49).toFixed(2);
}

async function main() {
    console.log("=== Importador de 1000 libros en español ===\n");

    let totalImportados = 0;
    let totalOmitidos = 0;
    const META = 1000;

    for (const termino of TERMINOS) {
        if (totalImportados >= META) break;

        console.log(`Buscando: "${termino}"...`);

        const libros = await buscarLibros(termino);

        for (const libro of libros) {
            if (totalImportados >= META) break;

            const isbn = libro.isbn ? libro.isbn[0] : null;
            if (!isbn) { totalOmitidos++; continue; }

            const titulo = libro.title || "Sin título";
            const autor = libro.author_name
                ? libro.author_name.join(", ")
                : "Autor desconocido";
            const editorial = libro.publisher ? libro.publisher[0] : null;
            const anio = libro.first_publish_year || null;
            const precio = generarPrecio();

            try {
                // Verificar si ya existe
                const existe = await pool.query(
                    "SELECT isbn FROM libro WHERE isbn = $1",
                    [isbn]
                );

                if (existe.rows.length > 0) {
                    totalOmitidos++;
                    continue;
                }

                await pool.query(
                    `INSERT INTO libro (isbn, titulo, autor, editorial, version, anio_publicacion, precio)
                     VALUES ($1, $2, $3, $4, NULL, $5, $6)`,
                    [isbn, titulo, autor, editorial, anio, precio]
                );

                totalImportados++;

                if (totalImportados % 50 === 0) {
                    console.log(`  → ${totalImportados} libros importados...`);
                }
            } catch (err) {
                // Ignorar errores de duplicados u otros
                totalOmitidos++;
            }
        }

        // Pausa entre búsquedas para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Si no alcanzamos 1000, hacer búsquedas adicionales con offset
    if (totalImportados < META) {
        console.log("\nBuscando más libros con offsets adicionales...");

        for (const termino of TERMINOS.slice(0, 20)) {
            if (totalImportados >= META) break;

            const libros = await buscarLibros(termino, 50);

            for (const libro of libros) {
                if (totalImportados >= META) break;

                const isbn = libro.isbn ? libro.isbn[0] : null;
                if (!isbn) { totalOmitidos++; continue; }

                const titulo = libro.title || "Sin título";
                const autor = libro.author_name
                    ? libro.author_name.join(", ")
                    : "Autor desconocido";
                const editorial = libro.publisher ? libro.publisher[0] : null;
                const anio = libro.first_publish_year || null;
                const precio = generarPrecio();

                try {
                    const existe = await pool.query(
                        "SELECT isbn FROM libro WHERE isbn = $1",
                        [isbn]
                    );

                    if (existe.rows.length > 0) {
                        totalOmitidos++;
                        continue;
                    }

                    await pool.query(
                        `INSERT INTO libro (isbn, titulo, autor, editorial, version, anio_publicacion, precio)
                         VALUES ($1, $2, $3, $4, NULL, $5, $6)`,
                        [isbn, titulo, autor, editorial, anio, precio]
                    );

                    totalImportados++;

                    if (totalImportados % 50 === 0) {
                        console.log(`  → ${totalImportados} libros importados...`);
                    }
                } catch (err) {
                    totalOmitidos++;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log("\n=== RESULTADO FINAL ===");
    console.log(`Libros importados: ${totalImportados}`);
    console.log(`Libros omitidos (sin ISBN o duplicados): ${totalOmitidos}`);

    await pool.end();
    console.log("\nConexión cerrada. ¡Listo!");
}

main().catch(err => {
    console.error("Error fatal:", err);
    pool.end();
    process.exit(1);
});
