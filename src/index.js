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
// LOGIN VENDEDOR
// =========================

app.post("/login-vendedor", async (req, res) => {
    try {
        const { correo_electronico } = req.body;
        if (!correo_electronico) {
            return res.status(400).json({
                acceso: false,
                error: "El correo es obligatorio."
            });
        }
        const result = await db.query(
            `
            SELECT
                p.correo_electronico,
                p.nombre,
                p.ap_paterno,
                e.rol
            FROM persona p
            JOIN empleado e
            ON p.correo_electronico = e.correo_electronico
            WHERE p.correo_electronico = $1
            AND e.rol IN ('Vendedor', 'Administrador', 'Dueno')
            `,
            [correo_electronico]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                acceso: false,
                error: "No tienes permiso para entrar al módulo de vendedor."
            });
        }
        res.json({
            acceso: true,
            empleado: result.rows[0]
        });

    } catch (error) {
        console.error("Error en login vendedor:", error);

        res.status(500).json({
            acceso: false,
            error: "Error interno del servidor."
        });
    }
});

// =========================
// CONSULTAR VENTAS
// =========================

app.get("/ventas", async (req, res) => {
    try {
        const result = await db.query(`

        SELECT
            v.id_venta,
            v.fecha,
            v.hora,
            v.total_pagado,
            v.metodo_de_pago,
        CONCAT(
                p.nombre,
                ' ',
                p.ap_paterno,
                ' (',
                e.rol,
                ')'
            ) AS vendedor
            FROM venta v
        JOIN persona p
        ON v.correo_electronico =
            p.correo_electronico
        JOIN empleado e
        ON p.correo_electronico =
            e.correo_electronico
        ORDER BY v.id_venta DESC
    `);
        res.json(result.rows);
    }

    catch (error) {console.error("Error al consultar ventas:",error);
        res.status(500).json({
            error:
                "Error al consultar ventas."
        });
    }
});


// =========================
// REGISTRAR VENTA
// =========================

app.post("/ventas", async (req, res) => {
    try {
        const {
            total_pagado,
            metodo_de_pago,
            correo_electronico,
            isbn,
            cantidad
        } = req.body;
        if (
            !total_pagado ||
            !metodo_de_pago ||
            !correo_electronico ||
            !isbn ||
            !cantidad
        ) {
            return res.status(400).json({
                error:
                    "Todos los campos son obligatorios."
            });
        }
        await db.query("BEGIN");

        const stockVenta = await db.query(
    `
    SELECT cantidad
    FROM lib_venta
    WHERE isbn = $1
    AND id_venta IS NULL
    `,
    [isbn]
);

if (
    stockVenta.rows.length === 0 ||
    stockVenta.rows[0].cantidad < cantidad
) {

    await db.query("ROLLBACK");

    return res.status(400).json({
        error:
            "No hay suficiente stock para vender."
    });

}

        // =========================
        // INSERTAR VENTA
        // =========================

        const ventaResult = await db.query(
            `
            INSERT INTO venta (
                fecha,
                hora,
                total_pagado,
                metodo_de_pago,
                correo_electronico
            )
            VALUES (
                CURRENT_DATE,
                CURRENT_TIME,
                $1,
                $2,
                $3
            )
            RETURNING id_venta
            `,
            [
                total_pagado,
                metodo_de_pago,
                correo_electronico
            ]
        );

        const idVenta =
            ventaResult.rows[0].id_venta;


        // =========================
        // INSERTAR LIBRO VENDIDO
        // =========================

        await db.query(
            `
            INSERT INTO lib_venta (
                cantidad,
                id_venta,
                isbn
            )
            VALUES (
                $1,
                $2,
                $3
            )
            `,
            [
                cantidad,
                idVenta,
                isbn
            ]
        );

        await db.query(
    `
    UPDATE lib_venta
    SET cantidad = cantidad - $1
    WHERE isbn = $2
    AND id_venta IS NULL
    `,
    [cantidad, isbn]
);

        await db.query("COMMIT");

        res.json({
            mensaje:
                "Venta registrada correctamente.",
            id_venta:
                idVenta
        });
    }

    catch (error) {
        await db.query("ROLLBACK");
        console.error(
            "Error al registrar venta:",
            error
        );

        res.status(500).json({
            error:
                "Error interno al registrar la venta."
        });
    }
});

// CONSULTAR CLIENTES
app.get("/clientes", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                p.correo_electronico,
                p.nombre,
                p.ap_paterno
            FROM persona p
            JOIN cliente c
            ON p.correo_electronico = c.correo_electronico
            ORDER BY p.nombre
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Error al consultar clientes:", error);
        res.status(500).json({
            error: "Error al consultar clientes."
        });
    }
});

// REGISTRAR PRÉSTAMO
app.post("/prestamos", async (req, res) => {
    try {
        const {
            correo_cliente,
            correo_empleado,
            isbn,
            cantidad,
            dia_de_vencimiento
        } = req.body;

        if (!correo_cliente || !correo_empleado || !isbn || !cantidad || !dia_de_vencimiento) {
            return res.status(400).json({
                error: "Todos los campos son obligatorios."
            });
        }

        await db.query("BEGIN");

        const stockPrestamo = await db.query(
            `
            SELECT cantidad
            FROM lib_pres
            WHERE isbn = $1
            AND id_prestamo IS NULL
            `,
            [isbn]
        );

        if (stockPrestamo.rows.length === 0 || stockPrestamo.rows[0].cantidad < cantidad) {
            await db.query("ROLLBACK");

            return res.status(400).json({
                error: "No hay suficientes libros disponibles para préstamo."
            });
        }

        const prestamoResult = await db.query(`
            INSERT INTO prestamo (
                multa,
                dia_de_inicio,
                dia_de_vencimiento,
                dia_de_entrega,
                cantidad_de_libros,
                correo_cliente,
                correo_empleado
            )
            VALUES (
                0,
                CURRENT_DATE,
                $1,
                NULL,
                $2,
                $3,
                $4
            )
            RETURNING id_prestamo
        `, [
            dia_de_vencimiento,
            cantidad,
            correo_cliente,
            correo_empleado
        ]);

        const idPrestamo = prestamoResult.rows[0].id_prestamo;

        await db.query(`
            INSERT INTO lib_pres (
                cantidad,
                id_prestamo,
                isbn
            )
            VALUES ($1, $2, $3)
        `, [
            cantidad,
            idPrestamo,
            isbn
        ]);

        await db.query(
            `
            UPDATE lib_pres
            SET cantidad = cantidad - $1
            WHERE isbn = $2
            AND id_prestamo IS NULL
            `,
            [cantidad, isbn]
        );

        await db.query("COMMIT");

        res.json({
            mensaje: "Préstamo registrado correctamente.",
            id_prestamo: idPrestamo
        });

    } catch (error) {
        await db.query("ROLLBACK");

        console.error("Error al registrar préstamo:", error);

        res.status(500).json({
            error: "Error interno al registrar préstamo."
        });
    }
});

// CONSULTAR PRÉSTAMOS
app.get("/prestamos", async (req, res) => {

    try {

        const result = await db.query(`

            SELECT

                pr.id_prestamo,
                pr.multa,
                pr.dia_de_inicio,
                pr.dia_de_vencimiento,
                pr.dia_de_entrega,
                pr.cantidad_de_libros,

                CASE
                    WHEN pr.dia_de_entrega IS NOT NULL 
                    THEN 'Devuelto'
                    
                    WHEN CURRENT_DATE > pr.dia_de_vencimiento 
                    THEN 'Vencido'
                    ELSE 'Activo'
                    
                END AS estado,

                CONCAT(
                    pc.nombre,
                    ' ',
                    pc.ap_paterno
                ) AS cliente,

                CONCAT(
                    pe.nombre,
                    ' ',
                    pe.ap_paterno,
                    ' (',
                    e.rol,
                    ')'
                ) AS bibliotecario

            FROM prestamo pr

            JOIN persona pc
            ON pr.correo_cliente =
                pc.correo_electronico

            JOIN persona pe
            ON pr.correo_empleado =
                pe.correo_electronico

            JOIN empleado e
            ON pe.correo_electronico =
                e.correo_electronico

            ORDER BY pr.id_prestamo DESC

        `);

        res.json(result.rows);

    }

    catch (error) {

        console.error(
            "Error al consultar préstamos:",
            error
        );

        res.status(500).json({

            error:
                "Error al consultar préstamos."

        });

    }

});

// =========================
// DEVOLVER PRÉSTAMO
// =========================

app.put("/prestamos/:id/devolver", async (req, res) => {
    try {
        const id_prestamo = req.params.id;

        const verificar = await db.query(
            `
            SELECT
                id_prestamo,
                dia_de_entrega,
                dia_de_vencimiento
            FROM prestamo
            WHERE id_prestamo = $1
            `,
            [id_prestamo]
        );

        if (verificar.rows.length === 0) {
            return res.status(404).json({
                error: "El préstamo no existe."
            });
        }

        if (verificar.rows[0].dia_de_entrega !== null) {
            return res.status(400).json({
                error: "Este préstamo ya fue devuelto."
            });
        }

        const result = await db.query(
            `
            UPDATE prestamo
            SET
                dia_de_entrega = CURRENT_DATE,
                multa =
                    CASE
                        WHEN CURRENT_DATE > dia_de_vencimiento
                        THEN (CURRENT_DATE - dia_de_vencimiento) * 10
                        ELSE 0
                    END
            WHERE id_prestamo = $1
            RETURNING *
            `,
            [id_prestamo]
        );

        res.json({
            mensaje: "Préstamo devuelto correctamente.",
            prestamo: result.rows[0]
        });

    } catch (error) {
        console.error("Error al devolver préstamo:", error);

        res.status(500).json({
            error: "Error interno al devolver préstamo."
        });
    }
});

// =========================
// REPORTE FACTURAS
// =========================

app.get("/facturas", async (req, res) => {

    try {

        const {
            fecha_inicio,
            fecha_fin
        } = req.query;

        if (!fecha_inicio || !fecha_fin) {

            return res.status(400).json({

                error:
                    "Fechas obligatorias."

            });

        }


        // =========================
        // VENTAS
        // =========================

        const ventas = await db.query(`

            SELECT

                'Venta' AS tipo,
                id_venta AS id,
                fecha,
                total_pagado AS monto,
                metodo_de_pago

            FROM venta

            WHERE fecha
            BETWEEN $1 AND $2

        `, [

            fecha_inicio,
            fecha_fin

        ]);


        // =========================
        // PRÉSTAMOS
        // =========================

        const prestamos = await db.query(`

            SELECT

                'Prestamo' AS tipo,
                id_prestamo AS id,
                dia_de_inicio AS fecha,
                multa AS monto,
                CASE

                    WHEN dia_de_entrega IS NULL
                    THEN 'Pendiente'

                    ELSE 'Devuelto'

                END AS estado

            FROM prestamo

            WHERE dia_de_inicio
            BETWEEN $1 AND $2

        `, [

            fecha_inicio,
            fecha_fin

        ]);


        res.json({

            ventas:
                ventas.rows,

            prestamos:
                prestamos.rows

        });

    }

    catch (error) {

        console.error(
            "Error al generar reporte:",
            error
        );

        res.status(500).json({

            error:
                "Error al generar reporte."

        });

    }

});

// =========================
// CONSULTAR CLIENTES
// =========================

app.get("/clientes", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                p.correo_electronico,
                p.nombre,
                p.ap_paterno,
                p.ap_materno,
                p.telefono,
                c.fecha_de_registro
            FROM persona p
            JOIN cliente c
            ON p.correo_electronico = c.correo_electronico
            ORDER BY p.nombre
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar clientes:", error);

        res.status(500).json({
            error: "Error al consultar clientes."
        });
    }
});


// =========================
// AGREGAR CLIENTE
// =========================

app.post("/clientes", async (req, res) => {
    try {
        const {
            correo_electronico,
            nombre,
            ap_paterno,
            ap_materno,
            fecha_de_nacimiento,
            telefono
        } = req.body;

        if (!correo_electronico || !nombre || !ap_paterno || !fecha_de_nacimiento) {
            return res.status(400).json({
                error: "Correo, nombre, apellido paterno y fecha de nacimiento son obligatorios."
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
            INSERT INTO cliente (
                correo_electronico,
                fecha_de_registro
            )
            VALUES ($1, CURRENT_DATE)
            `,
            [correo_electronico]
        );

        await db.query("COMMIT");

        res.json({
            mensaje: "Cliente agregado correctamente."
        });

    } catch (error) {
        await db.query("ROLLBACK");

        console.error("Error al agregar cliente:", error);

        res.status(500).json({
            error: "Error interno al agregar cliente."
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