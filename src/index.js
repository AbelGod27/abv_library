const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/personas", (req, res) => {
    db.query("SELECT * FROM Persona", (err, results) => {
        if (err) {
            console.error("Error en consulta:", err);
            return res.status(500).json(err);
        }

        res.json(results);
    });
});

app.get("/libros", (req, res) => {
    const buscar = req.query.buscar || "";

    const sql = `
        SELECT isbn, titulo, autor, editorial, version, anio_publicacion
        FROM Libro
        WHERE isbn LIKE ?
        OR titulo LIKE ?
        OR autor LIKE ?
        OR editorial LIKE ?
    `;

    const valor = `%${buscar}%`;

    db.query(sql, [valor, valor, valor, valor], (err, results) => {
        if (err) {
            console.error("Error en consulta:", err);
            return res.status(500).json(err);
        }

        res.json(results);
    });
});

app.post("/libros", (req, res) => {
    const {
        isbn,
        titulo,
        autor,
        editorial,
        version,
        anio_publicacion
    } = req.body;

    const sql = `
        INSERT INTO Libro
        (isbn, titulo, autor, editorial, version, anio_publicacion)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [isbn, titulo, autor, editorial, version, anio_publicacion],
        (err, result) => {
            if (err) {
                console.error("Error al insertar:", err);
                return res.status(500).json(err);
            }

            res.json({
                mensaje: "Libro agregado correctamente"
            });
        }
    );
});

app.listen(3000, () => {
    console.log("Servidor en http://localhost:3000");
});