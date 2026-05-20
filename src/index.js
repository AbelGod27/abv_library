const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));


// =========================
// LOGIN ADMIN
// =========================

app.post("/login-admin", async (req, res) => {
    try {
        const { password } = req.body;

        if (password === process.env.ADMIN_PASSWORD) {
            return res.json({
                acceso: true
            });
        }

        res.status(401).json({
            acceso: false,
            error: "Contraseña incorrecta"
        });

    } catch (error) {
        console.error("Error en login:", error);

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});


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
            ORDER BY titulo
        `;

        const valor = `%${buscar}%`;

        const result = await db.query(sql, [valor]);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar libros:", error);

        res.status(500).json({
            error: "Error al consultar libros."
        });
    }
});


// =========================
// CONSULTAR API EXTERNA
// =========================

app.get("/api/libros-externos", async (req, res) => {
    try {
        const buscar = req.query.buscar || "literature";

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
            autor: libro.author_name
                ? libro.author_name.join(", ")
                : "Autor desconocido",
            editorial: libro.publisher
                ? libro.publisher[0]
                : "Sin editorial",
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

        if (!isbn || !titulo || !autor) {
            return res.status(400).json({
                error: "ISBN, título y autor son obligatorios."
            });
        }

        const verificarSql = `
            SELECT isbn
            FROM libro
            WHERE isbn = $1
        `;

        const verificar = await db.query(verificarSql, [isbn]);

        if (verificar.rows.length > 0) {
            return res.status(409).json({
                error: "No se puede agregar el libro porque el ISBN ya existe."
            });
        }

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

        await db.query(insertarSql, [
            isbn,
            titulo,
            autor,
            editorial || null,
            version || null,
            anio_publicacion || null
        ]);

        res.json({
            mensaje: "Libro agregado correctamente."
        });

    } catch (error) {
        console.error("Error al agregar libro:", error);

        res.status(500).json({
            error: "Error interno del servidor."
        });
    }
});


// =========================
// CONSULTAR PROVEEDORES
// =========================

app.get("/proveedores", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                id_proveedor,
                nombre
            FROM proveedor
            ORDER BY id_proveedor
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar proveedores:", error);

        res.status(500).json({
            error: "Error al consultar proveedores."
        });
    }
});


// =========================
// AGREGAR PROVEEDOR
// =========================

app.post("/proveedores", async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({
                error: "El nombre del proveedor es obligatorio."
            });
        }

        await db.query(
            `
            INSERT INTO proveedor (nombre)
            VALUES ($1)
            `,
            [nombre]
        );

        res.json({
            mensaje: "Proveedor agregado correctamente."
        });

    } catch (error) {
        console.error("Error al agregar proveedor:", error);

        res.status(500).json({
            error: "Error interno al agregar proveedor."
        });
    }
});

// =========================
// CONSULTAR EMPLEADOS
// =========================

app.get("/empleados", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                p.correo_electronico,
                p.nombre,
                p.ap_paterno,
                p.ap_materno,
                p.telefono,
                e.rol
            FROM persona p
            JOIN empleado e
            ON p.correo_electronico = e.correo_electronico
            ORDER BY p.nombre
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar empleados:", error);

        res.status(500).json({
            error: "Error al consultar empleados."
        });
    }
});


// =========================
// AGREGAR EMPLEADO
// =========================

app.post("/empleados", async (req, res) => {
    try {
        const {
            correo_electronico,
            nombre,
            ap_paterno,
            ap_materno,
            fecha_de_nacimiento,
            telefono,
            rol
        } = req.body;

        if (!correo_electronico || !nombre || !ap_paterno || !fecha_de_nacimiento || !rol) {
            return res.status(400).json({
                error: "Correo, nombre, apellido paterno, fecha de nacimiento y rol son obligatorios."
            });
        }

        const existePersona = await db.query(
            "SELECT correo_electronico FROM persona WHERE correo_electronico = $1",
            [correo_electronico]
        );

        if (existePersona.rows.length > 0) {
            return res.status(409).json({
                error: "Ya existe una persona con ese correo."
            });
        }

        await db.query("BEGIN");

        await db.query(
            `
            INSERT INTO persona (
                correo_electronico,
                nombre,
                ap_paterno,
                ap_materno,
                fecha_de_nacimiento,
                telefono
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
                correo_electronico,
                nombre,
                ap_paterno,
                ap_materno || null,
                fecha_de_nacimiento,
                telefono || null
            ]
        );

        await db.query(
            `
            INSERT INTO empleado (
                correo_electronico,
                rol
            )
            VALUES ($1, $2)
            `,
            [
                correo_electronico,
                rol
            ]
        );

        await db.query("COMMIT");

        res.json({
            mensaje: "Empleado agregado correctamente."
        });

    } catch (error) {
        await db.query("ROLLBACK");

        console.error("Error al agregar empleado:", error);

        res.status(500).json({
            error: "Error interno al agregar empleado."
        });
    }
});

// =========================
// SERVIDOR
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});