const axios = require("axios");
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));


// =========================
// CONSULTAR LIBROS LOCALES
// =========================

app.get("/libros", async (req, res) => {

    try {

        const buscar = req.query.buscar || "";

        const sql = `
            SELECT
                isbn,
                titulo,
                autor,
                editorial,
                version,
                anio_publicacion
            FROM libro
            WHERE
                isbn ILIKE $1
                OR titulo ILIKE $1
                OR autor ILIKE $1
                OR editorial ILIKE $1
        `;

        const values = [`%${buscar}%`];

        const result = await db.query(sql, values);

        res.json(result.rows);

    }

    catch (error) {

        console.error("Error al consultar libros:", error);

        res.status(500).json({
            error: "Error al consultar libros."
        });

    }

});


// =========================
// CONSULTAR API
// =========================

app.get("/api/libros-externos", async (req, res) => {
    try {
        const buscar = req.query.buscar || "programming";

        const url = "https://openlibrary.org/search.json";

        const response = await axios.get(url, {
            params: {
                q: buscar,
                limit: 20,
                fields: "title,author_name,first_publish_year,isbn,publisher"
            }
        });

        const libros = response.data.docs.map(libro => ({
            isbn: libro.isbn ? libro.isbn[0] : "Sin ISBN",
            titulo: libro.title || "Sin título",
            autor: libro.author_name ? libro.author_name.join(", ") : "Autor desconocido",
            editorial: libro.publisher ? libro.publisher[0] : "Sin editorial",
            version: "",
            anio_publicacion: libro.first_publish_year || ""
        }));

        res.json(libros);

    } catch (error) {
        console.error("Error API externa:", error.message);
        res.status(500).json({
            error: "Error al consultar API externa."
        });
    }
});


// =========================
// AGREGAR LIBRO
// =========================

app.post("/libros", async (req, res) => {

    try {

        const {

            isbn,
            titulo,
            autor,
            editorial,
            version,
            anio_publicacion

        } = req.body;

        // =========================
        // VALIDACIONES
        // =========================

        if (!isbn || !titulo || !autor) {

            return res.status(400).json({
                error:
                    "ISBN, título y autor son obligatorios."
            });

        }

        // =========================
        // VERIFICAR DUPLICIDAD
        // =========================

        const verificarSql = `
            SELECT isbn
            FROM libro
            WHERE isbn = $1
        `;

        const verificar =
            await db.query(verificarSql, [isbn]);

        if (verificar.rows.length > 0) {

            return res.status(409).json({
                error:
                    "No se puede agregar el libro porque el ISBN ya existe."
            });

        }

        // =========================
        // INSERTAR LIBRO
        // =========================

        const insertarSql = `
            INSERT INTO libro
            (
                isbn,
                titulo,
                autor,
                editorial,
                version,
                anio_publicacion
            )
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        const values = [

            isbn,
            titulo,
            autor,
            editorial || null,
            version || null,
            anio_publicacion || null

        ];

        await db.query(insertarSql, values);

        res.json({
            mensaje:
                "Libro agregado correctamente."
        });

    }

    catch (error) {

        console.error("Error al agregar libro:", error);

        res.status(500).json({
            error:
                "Error interno del servidor."
        });

    }

});


// =========================
// SERVIDOR
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Servidor en http://localhost:${PORT}`
    );

});