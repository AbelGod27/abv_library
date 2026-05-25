require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const bcrypt = require("bcrypt");
const db = require("./db");

const SALT_ROUNDS = 10;

// Validar formato de correo electrónico
function esCorreoValido(correo) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));


// =========================
// LOGIN UNIFICADO
// =========================

app.post("/login", async (req, res) => {
    try {
        const { correo_electronico, password } = req.body;

        if (!correo_electronico || !password) {
            return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
        }

        if (!esCorreoValido(correo_electronico)) {
            return res.status(400).json({ error: "El correo no tiene un formato válido." });
        }

        // Buscar persona
        const persona = await db.query(
            "SELECT correo_electronico, nombre, ap_paterno, contrasena_hash FROM persona WHERE correo_electronico = $1",
            [correo_electronico]
        );

        if (persona.rows.length === 0) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos." });
        }

        const user = persona.rows[0];

        if (!user.contrasena_hash) {
            return res.status(401).json({ error: "Este usuario no tiene contraseña configurada." });
        }

        const coincide = await bcrypt.compare(password, user.contrasena_hash);
        if (!coincide) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos." });
        }

        // Determinar roles disponibles
        const roles = [];

        // Es empleado?
        const empleado = await db.query(
            "SELECT rol FROM empleado WHERE correo_electronico = $1",
            [correo_electronico]
        );
        if (empleado.rows.length > 0) {
            const rol = empleado.rows[0].rol;
            if (["Administrador", "Dueno"].includes(rol)) {
                roles.push({ tipo: "admin", label: "Administrador", rol });
            }
            if (["Vendedor", "Bibliotecario", "Administrador", "Dueno"].includes(rol)) {
                roles.push({ tipo: "bibliotecario", label: "Bibliotecario", rol });
            }
        }

        // Es cliente?
        const cliente = await db.query(
            "SELECT correo_electronico, fecha_de_registro FROM cliente WHERE correo_electronico = $1",
            [correo_electronico]
        );
        if (cliente.rows.length > 0) {
            roles.push({ tipo: "cliente", label: "Cliente" });
        }

        if (roles.length === 0) {
            return res.status(401).json({ error: "No tienes un rol asignado en el sistema." });
        }

        res.json({
            acceso: true,
            nombre: user.nombre,
            ap_paterno: user.ap_paterno,
            correo_electronico: user.correo_electronico,
            roles
        });

    } catch (error) {
        console.error("Error en login unificado:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

// =========================
// LOGIN ADMIN
// =========================

app.post("/login-admin", async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ acceso: false, error: "La contraseña es obligatoria." });
        }

        // El admin usa una contraseña almacenada como hash en la variable de entorno.
        // Para generar el hash inicial ejecuta en Node:
        //   require('bcrypt').hash('TuContraseña', 10).then(console.log)
        // y guarda el resultado en ADMIN_PASSWORD_HASH en el .env
        const hash = process.env.ADMIN_PASSWORD_HASH;

        if (!hash) {
            // Fallback: comparación en texto plano (solo para desarrollo sin hash configurado)
            if (password === process.env.ADMIN_PASSWORD) {
                return res.json({ acceso: true });
            }
            return res.status(401).json({ acceso: false, error: "Contraseña incorrecta." });
        }

        const coincide = await bcrypt.compare(password, hash);

        if (coincide) {
            return res.json({ acceso: true });
        }

        res.status(401).json({ acceso: false, error: "Contraseña incorrecta." });

    } catch (error) {
        console.error("Error en login admin:", error);
        res.status(500).json({ error: "Error interno del servidor." });
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
                anio_publicacion,
                precio
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
        const buscar = req.query.buscar || "programacion";

        const url = "https://openlibrary.org/search.json";

        const response = await axios.get(url, {
            params: {
                q: buscar,
                language: "spa",
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
            anio_publicacion,
            precio
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
                anio_publicacion,
                precio
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await db.query(insertarSql, [
            isbn,
            titulo,
            autor,
            editorial || null,
            version || null,
            anio_publicacion || null,
            precio || 0
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
// CONSULTAR STOCK DE LIBROS
// =========================

app.get("/stock", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                l.isbn,
                l.titulo,
                l.autor,
                l.precio,
                COALESCE(lv.cantidad, 0) AS stock_venta,
                COALESCE(lp.cantidad, 0) AS stock_prestamo
            FROM libro l
            LEFT JOIN lib_venta lv ON l.isbn = lv.isbn AND lv.id_venta IS NULL
            LEFT JOIN lib_pres lp ON l.isbn = lp.isbn AND lp.id_prestamo IS NULL
            ORDER BY l.titulo
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar stock:", error);
        res.status(500).json({ error: "Error al consultar stock." });
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
// ACTUALIZAR PROVEEDOR
// =========================

app.put("/proveedores/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: "El nombre es obligatorio." });
        }

        const result = await db.query(
            "UPDATE proveedor SET nombre = $1 WHERE id_proveedor = $2 RETURNING *",
            [nombre, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Proveedor no encontrado." });
        }

        res.json({ mensaje: "Proveedor actualizado correctamente." });

    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
        res.status(500).json({ error: "Error al actualizar proveedor." });
    }
});

// =========================
// ELIMINAR PROVEEDOR
// =========================

app.delete("/proveedores/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "DELETE FROM proveedor WHERE id_proveedor = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Proveedor no encontrado." });
        }

        res.json({ mensaje: "Proveedor eliminado correctamente." });

    } catch (error) {
        console.error("Error al eliminar proveedor:", error);
        res.status(500).json({ error: "Error al eliminar proveedor." });
    }
});

// =========================
// PROVEEDOR - LIBROS (prov_suministra_lib)
// =========================

app.get("/proveedores-libros", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                psl.id_proveedor,
                p.nombre AS proveedor,
                psl.isbn,
                l.titulo,
                l.autor
            FROM prov_suministra_lib psl
            JOIN proveedor p ON psl.id_proveedor = p.id_proveedor
            JOIN libro l ON psl.isbn = l.isbn
            ORDER BY p.nombre, l.titulo
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar proveedores-libros:", error);
        res.status(500).json({ error: "Error al consultar relación proveedor-libro." });
    }
});

app.post("/proveedores-libros", async (req, res) => {
    try {
        const { id_proveedor, isbn } = req.body;

        if (!id_proveedor || !isbn) {
            return res.status(400).json({ error: "Proveedor e ISBN son obligatorios." });
        }

        // Verificar que no exista ya la relación
        const existe = await db.query(
            "SELECT 1 FROM prov_suministra_lib WHERE id_proveedor = $1 AND isbn = $2",
            [id_proveedor, isbn]
        );

        if (existe.rows.length > 0) {
            return res.status(409).json({ error: "Este proveedor ya tiene asignado ese libro." });
        }

        await db.query(
            "INSERT INTO prov_suministra_lib (id_proveedor, isbn) VALUES ($1, $2)",
            [id_proveedor, isbn]
        );

        res.json({ mensaje: "Libro asignado al proveedor correctamente." });

    } catch (error) {
        console.error("Error al asignar libro a proveedor:", error);
        res.status(500).json({ error: "Error al asignar libro al proveedor." });
    }
});

// Recibir paquete de libros de un proveedor (suma stock)
app.post("/proveedores/recibir-paquete", async (req, res) => {
    try {
        const { id_proveedor, isbn, cantidad, cantidad_venta, cantidad_prestamo, costo_total } = req.body;

        if (!id_proveedor || !isbn || !cantidad || cantidad < 1) {
            return res.status(400).json({ error: "Proveedor, ISBN y cantidad son obligatorios." });
        }

        if (costo_total === undefined || costo_total === null || Number(costo_total) < 0) {
            return res.status(400).json({ error: "El costo total del paquete es obligatorio." });
        }

        // Verificar que el proveedor suministra ese libro
        const relacion = await db.query(
            "SELECT 1 FROM prov_suministra_lib WHERE id_proveedor = $1 AND isbn = $2",
            [id_proveedor, isbn]
        );

        if (relacion.rows.length === 0) {
            return res.status(400).json({ error: "Este proveedor no suministra ese libro. Asígnalo primero." });
        }

        const cantidadNum = Math.floor(Number(cantidad));
        const cantVenta = Math.floor(Number(cantidad_venta) || 0);
        const cantPrestamo = Math.floor(Number(cantidad_prestamo) || 0);

        if ((cantVenta + cantPrestamo) !== cantidadNum) {
            return res.status(400).json({
                error: `Las unidades para venta (${cantVenta}) + préstamo (${cantPrestamo}) deben sumar ${cantidadNum}.`
            });
        }

        await db.query("BEGIN");

        // Registrar la recepción en el historial
        await db.query(
            "INSERT INTO recepcion_paquete (id_proveedor, isbn, cantidad, costo_total) VALUES ($1, $2, $3, $4)",
            [id_proveedor, isbn, cantidadNum, Number(costo_total)]
        );

        // Sumar stock para venta
        if (cantVenta > 0) {
            const stockVenta = await db.query(
                "SELECT cantidad FROM lib_venta WHERE isbn = $1 AND id_venta IS NULL",
                [isbn]
            );

            if (stockVenta.rows.length > 0) {
                await db.query(
                    "UPDATE lib_venta SET cantidad = cantidad + $1 WHERE isbn = $2 AND id_venta IS NULL",
                    [cantVenta, isbn]
                );
            } else {
                await db.query(
                    "INSERT INTO lib_venta (cantidad, id_venta, isbn) VALUES ($1, NULL, $2)",
                    [cantVenta, isbn]
                );
            }
        }

        // Sumar stock para préstamo
        if (cantPrestamo > 0) {
            const stockPres = await db.query(
                "SELECT cantidad FROM lib_pres WHERE isbn = $1 AND id_prestamo IS NULL",
                [isbn]
            );

            if (stockPres.rows.length > 0) {
                await db.query(
                    "UPDATE lib_pres SET cantidad = cantidad + $1 WHERE isbn = $2 AND id_prestamo IS NULL",
                    [cantPrestamo, isbn]
                );
            } else {
                await db.query(
                    "INSERT INTO lib_pres (cantidad, id_prestamo, isbn) VALUES ($1, NULL, $2)",
                    [cantPrestamo, isbn]
                );
            }
        }

        await db.query("COMMIT");

        res.json({
            mensaje: `Paquete recibido: ${cantVenta} para venta, ${cantPrestamo} para préstamo (total: ${cantidadNum}). Costo: $${Number(costo_total).toFixed(2)}`
        });

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("Error al recibir paquete:", error);
        res.status(500).json({ error: "Error al recibir el paquete." });
    }
});

// Consultar libros que suministra un proveedor específico
app.get("/proveedores/:id/libros", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT l.isbn, l.titulo, l.autor
            FROM prov_suministra_lib psl
            JOIN libro l ON psl.isbn = l.isbn
            WHERE psl.id_proveedor = $1
            ORDER BY l.titulo
        `, [id]);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar libros del proveedor:", error);
        res.status(500).json({ error: "Error al consultar libros del proveedor." });
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
                p.fecha_de_nacimiento,
                p.telefono,
                e.rol,
                (p.contrasena_hash IS NOT NULL) AS tiene_password
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
            rol,
            password
        } = req.body;

        if (!correo_electronico || !nombre || !ap_paterno || !fecha_de_nacimiento || !rol || !password) {
            return res.status(400).json({
                error: "Correo, nombre, apellido paterno, fecha de nacimiento, rol y contraseña son obligatorios."
            });
        }

        if (!esCorreoValido(correo_electronico)) {
            return res.status(400).json({
                error: "El correo electrónico no tiene un formato válido."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 8 caracteres."
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

        const contrasena_hash = await bcrypt.hash(password, SALT_ROUNDS);

        await db.query("BEGIN");

        await db.query(
            `
            INSERT INTO persona (
                correo_electronico,
                nombre,
                ap_paterno,
                ap_materno,
                fecha_de_nacimiento,
                telefono,
                contrasena_hash
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                correo_electronico,
                nombre,
                ap_paterno,
                ap_materno || null,
                fecha_de_nacimiento,
                telefono || null,
                contrasena_hash
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
// ACTUALIZAR EMPLEADO
// =========================

app.put("/empleados/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;
        const { nombre, ap_paterno, ap_materno, fecha_de_nacimiento, telefono, rol } = req.body;

        if (!nombre || !ap_paterno || !fecha_de_nacimiento || !rol) {
            return res.status(400).json({ error: "Nombre, apellido paterno, fecha de nacimiento y rol son obligatorios." });
        }

        await db.query("BEGIN");

        await db.query(`
            UPDATE persona SET
                nombre = $1,
                ap_paterno = $2,
                ap_materno = $3,
                fecha_de_nacimiento = $4,
                telefono = $5
            WHERE correo_electronico = $6
        `, [nombre, ap_paterno, ap_materno || null, fecha_de_nacimiento, telefono || null, correo]);

        await db.query(`
            UPDATE empleado SET rol = $1
            WHERE correo_electronico = $2
        `, [rol, correo]);

        await db.query("COMMIT");

        res.json({ mensaje: "Empleado actualizado correctamente." });

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("Error al actualizar empleado:", error);
        res.status(500).json({ error: "Error interno al actualizar empleado." });
    }
});

// =========================
// ELIMINAR EMPLEADO
// =========================

app.delete("/empleados/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        const existe = await db.query(
            "SELECT correo_electronico FROM empleado WHERE correo_electronico = $1",
            [correo]
        );

        if (existe.rows.length === 0) {
            return res.status(404).json({ error: "El empleado no existe." });
        }

        await db.query("DELETE FROM persona WHERE correo_electronico = $1", [correo]);

        res.json({ mensaje: "Empleado eliminado correctamente." });

    } catch (error) {
        console.error("Error al eliminar empleado:", error);
        res.status(500).json({ error: "Error interno al eliminar empleado." });
    }
});

// =========================
// LOGIN VENDEDOR / BIBLIOTECARIO
// =========================

app.post("/login-vendedor", async (req, res) => {
    try {
        const { correo_electronico, password } = req.body;

        if (!correo_electronico || !password) {
            return res.status(400).json({
                acceso: false,
                error: "El correo y la contraseña son obligatorios."
            });
        }

        if (!esCorreoValido(correo_electronico)) {
            return res.status(400).json({
                acceso: false,
                error: "El correo electrónico no tiene un formato válido."
            });
        }

        const result = await db.query(
            `
            SELECT
                p.correo_electronico,
                p.nombre,
                p.ap_paterno,
                p.contrasena_hash,
                e.rol
            FROM persona p
            JOIN empleado e
            ON p.correo_electronico = e.correo_electronico
            WHERE p.correo_electronico = $1
            AND e.rol IN ('Vendedor', 'Administrador', 'Dueno', 'Bibliotecario')
            `,
            [correo_electronico]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                acceso: false,
                error: "Correo o contraseña incorrectos."
            });
        }

        const empleado = result.rows[0];

        if (!empleado.contrasena_hash) {
            return res.status(401).json({
                acceso: false,
                error: "Este usuario aún no tiene contraseña configurada."
            });
        }

        const coincide = await bcrypt.compare(password, empleado.contrasena_hash);

        if (!coincide) {
            return res.status(401).json({
                acceso: false,
                error: "Correo o contraseña incorrectos."
            });
        }

        // No devolver el hash al cliente
        const { contrasena_hash, ...empleadoSeguro } = empleado;

        res.json({
            acceso: true,
            empleado: empleadoSeguro
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
// LOGIN CLIENTE
// =========================

app.post("/login-cliente", async (req, res) => {
    try {
        const { correo_electronico, password } = req.body;

        if (!correo_electronico || !password) {
            return res.status(400).json({
                acceso: false,
                error: "El correo y la contraseña son obligatorios."
            });
        }

        if (!esCorreoValido(correo_electronico)) {
            return res.status(400).json({
                acceso: false,
                error: "El correo electrónico no tiene un formato válido."
            });
        }

        const result = await db.query(
            `
            SELECT
                p.correo_electronico,
                p.nombre,
                p.ap_paterno,
                p.contrasena_hash,
                c.fecha_de_registro
            FROM persona p
            JOIN cliente c
            ON p.correo_electronico = c.correo_electronico
            WHERE p.correo_electronico = $1
            `,
            [correo_electronico]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                acceso: false,
                error: "Correo o contraseña incorrectos."
            });
        }

        const cliente = result.rows[0];

        if (!cliente.contrasena_hash) {
            return res.status(401).json({
                acceso: false,
                error: "Este usuario aún no tiene contraseña configurada."
            });
        }

        const coincide = await bcrypt.compare(password, cliente.contrasena_hash);

        if (!coincide) {
            return res.status(401).json({
                acceso: false,
                error: "Correo o contraseña incorrectos."
            });
        }

        const { contrasena_hash, ...clienteSeguro } = cliente;

        res.json({
            acceso: true,
            cliente: clienteSeguro
        });

    } catch (error) {
        console.error("Error en login cliente:", error);
        res.status(500).json({
            acceso: false,
            error: "Error interno del servidor."
        });
    }
});

// =========================
// ESTABLECER / CAMBIAR CONTRASEÑA
// =========================

app.put("/usuarios/:correo/password", async (req, res) => {
    try {
        const { correo } = req.params;
        const { password_actual, password_nueva } = req.body;

        if (!password_nueva || password_nueva.length < 8) {
            return res.status(400).json({
                error: "La nueva contraseña debe tener al menos 8 caracteres."
            });
        }

        const result = await db.query(
            "SELECT contrasena_hash FROM persona WHERE correo_electronico = $1",
            [correo]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        const hashActual = result.rows[0].contrasena_hash;

        // Si ya tiene contraseña, verificar la actual antes de cambiar
        if (hashActual) {
            if (!password_actual) {
                return res.status(400).json({ error: "Debes proporcionar la contraseña actual." });
            }
            const coincide = await bcrypt.compare(password_actual, hashActual);
            if (!coincide) {
                return res.status(401).json({ error: "La contraseña actual es incorrecta." });
            }
        }

        const nuevoHash = await bcrypt.hash(password_nueva, SALT_ROUNDS);

        await db.query(
            "UPDATE persona SET contrasena_hash = $1 WHERE correo_electronico = $2",
            [nuevoHash, correo]
        );

        res.json({ mensaje: "Contraseña actualizada correctamente." });

    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        res.status(500).json({ error: "Error interno al cambiar contraseña." });
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
            cantidad,
            correo_cliente
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

        // Validar correo del cliente si se proporcionó
        if (correo_cliente) {
            const clienteExiste = await db.query(
                "SELECT correo_electronico FROM cliente WHERE correo_electronico = $1",
                [correo_cliente]
            );
            if (clienteExiste.rows.length === 0) {
                return res.status(404).json({
                    error: "El cliente no está registrado."
                });
            }
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

        // Sumar puntos al cliente si se asoció a la venta
        let puntosGanados = 0;
        if (correo_cliente) {
            puntosGanados = Math.floor(Number(total_pagado) / 10);
            if (puntosGanados > 0) {
                await db.query(
                    `UPDATE cliente SET puntos = puntos + $1 WHERE correo_electronico = $2`,
                    [puntosGanados, correo_cliente]
                );
                await db.query(
                    `INSERT INTO historial_puntos (correo_cliente, id_venta, puntos_ganados)
                     VALUES ($1, $2, $3)`,
                    [correo_cliente, idVenta, puntosGanados]
                );
            }
        }

        await db.query("COMMIT");

        res.json({
            mensaje:
                "Venta registrada correctamente.",
            id_venta:
                idVenta,
            puntos_ganados: puntosGanados
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

// CONSULTAR CLIENTES — ver ruta completa más abajo


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


        // =========================
        // RECEPCIONES DE PROVEEDORES
        // =========================

        const recepciones = await db.query(`

            SELECT
                'Recepcion' AS tipo,
                rp.id_recepcion AS id,
                rp.fecha,
                rp.cantidad,
                rp.costo_total AS monto,
                p.nombre AS proveedor,
                l.titulo AS libro

            FROM recepcion_paquete rp
            JOIN proveedor p ON rp.id_proveedor = p.id_proveedor
            JOIN libro l ON rp.isbn = l.isbn

            WHERE rp.fecha
            BETWEEN $1 AND $2

            ORDER BY rp.fecha DESC

        `, [
            fecha_inicio,
            fecha_fin
        ]);


        res.json({

            ventas:
                ventas.rows,

            prestamos:
                prestamos.rows,

            recepciones:
                recepciones.rows

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
                p.fecha_de_nacimiento,
                p.telefono,
                c.fecha_de_registro,
                (p.contrasena_hash IS NOT NULL) AS tiene_password

            FROM persona p

            JOIN cliente c
            ON p.correo_electronico =
                c.correo_electronico

            ORDER BY p.nombre
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(
            "Error al consultar clientes:",
            error
        );

        res.status(500).json({
            error:
                "Error al consultar clientes."
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
            telefono,
            password
        } = req.body;

        if (!correo_electronico || !nombre || !ap_paterno || !fecha_de_nacimiento) {
            return res.status(400).json({
                error: "Correo, nombre, apellido paterno y fecha de nacimiento son obligatorios."
            });
        }

        if (password && password.length < 8) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 8 caracteres."
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

        const contrasena_hash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;

        await db.query("BEGIN");

        await db.query(
            `
            INSERT INTO persona (
                correo_electronico,
                nombre,
                ap_paterno,
                ap_materno,
                fecha_de_nacimiento,
                telefono,
                contrasena_hash
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                correo_electronico,
                nombre,
                ap_paterno,
                ap_materno || null,
                fecha_de_nacimiento,
                telefono || null,
                contrasena_hash
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
// Editar un LIBRO
// =========================

app.put("/libros/:isbn", async (req, res) => {
    try {
        const { isbn } = req.params;

        const {
            titulo,
            autor,
            editorial,
            version,
            anio_publicacion,
            precio
        } = req.body;

        if (!titulo || !autor) {
            return res.status(400).json({
                error: "Título y autor son obligatorios."
            });
        }

        const result = await db.query(
            `
            UPDATE libro
            SET
                titulo = $1,
                autor = $2,
                editorial = $3,
                version = $4,
                anio_publicacion = $5,
                precio = $6
            WHERE isbn = $7
            RETURNING *
            `,
            [
                titulo,
                autor,
                editorial || null,
                version || null,
                anio_publicacion || null,
                precio || 0,
                isbn
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "El libro no existe."
            });
        }

        res.json({
            mensaje: "Libro actualizado correctamente.",
            libro: result.rows[0]
        });

    } catch (error) {
        console.error("Error al actualizar libro:", error);

        res.status(500).json({
            error: "Error interno al actualizar libro."
        });
    }
});

// =========================
// ACTUALIZAR CLIENTE
// =========================

app.put("/clientes/:correo", async (req, res) => {
    try {
        const correoActual = req.params.correo;

        const {
            nombre,
            ap_paterno,
            ap_materno,
            fecha_de_nacimiento,
            telefono
        } = req.body;

        if (!nombre || !ap_paterno || !fecha_de_nacimiento) {
            return res.status(400).json({
                error: "Nombre, apellido paterno y fecha de nacimiento son obligatorios."
            });
        }

        const result = await db.query(
            `
            UPDATE persona
            SET
                nombre = $1,
                ap_paterno = $2,
                ap_materno = $3,
                fecha_de_nacimiento = $4,
                telefono = $5
            WHERE correo_electronico = $6
            RETURNING *
            `,
            [
                nombre,
                ap_paterno,
                ap_materno || null,
                fecha_de_nacimiento,
                telefono || null,
                correoActual
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "El cliente no existe."
            });
        }

        res.json({
            mensaje: "Cliente actualizado correctamente."
        });

    } catch (error) {
        console.error("Error al actualizar cliente:", error);

        res.status(500).json({
            error: "Error interno al actualizar cliente."
        });
    }
});


// =========================
// ELIMINAR CLIENTE
// =========================

app.delete("/clientes/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        const existe = await db.query(
            `
            SELECT correo_electronico
            FROM cliente
            WHERE correo_electronico = $1
            `,
            [correo]
        );

        if (existe.rows.length === 0) {
            return res.status(404).json({
                error: "El cliente no existe."
            });
        }

        await db.query(
            `
            DELETE FROM persona
            WHERE correo_electronico = $1
            `,
            [correo]
        );

        res.json({
            mensaje: "Cliente eliminado correctamente."
        });

    } catch (error) {
        console.error("Error al eliminar cliente:", error);

        res.status(500).json({
            error: "No se puede eliminar el cliente porque puede tener préstamos registrados."
        });
    }
});

// =========================
// REGISTRO PÚBLICO DE CLIENTE
// =========================

app.post("/registro-cliente", async (req, res) => {
    try {
        const {
            correo_electronico,
            nombre,
            ap_paterno,
            ap_materno,
            fecha_de_nacimiento,
            telefono,
            password
        } = req.body;

        if (!correo_electronico || !nombre || !ap_paterno || !fecha_de_nacimiento || !password) {
            return res.status(400).json({
                error: "Correo, nombre, apellido paterno, fecha de nacimiento y contraseña son obligatorios."
            });
        }

        if (!esCorreoValido(correo_electronico)) {
            return res.status(400).json({
                error: "El correo electrónico no tiene un formato válido."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 8 caracteres."
            });
        }

        const existePersona = await db.query(
            "SELECT correo_electronico FROM persona WHERE correo_electronico = $1",
            [correo_electronico]
        );

        if (existePersona.rows.length > 0) {
            return res.status(409).json({
                error: "Ya existe una cuenta con ese correo electrónico."
            });
        }

        const contrasena_hash = await bcrypt.hash(password, SALT_ROUNDS);

        await db.query("BEGIN");

        await db.query(
            `
            INSERT INTO persona (
                correo_electronico,
                nombre,
                ap_paterno,
                ap_materno,
                fecha_de_nacimiento,
                telefono,
                contrasena_hash
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                correo_electronico,
                nombre,
                ap_paterno,
                ap_materno || null,
                fecha_de_nacimiento,
                telefono || null,
                contrasena_hash
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
            mensaje: "Cuenta creada exitosamente. Ya puedes iniciar sesión."
        });

    } catch (error) {
        await db.query("ROLLBACK");

        console.error("Error en registro de cliente:", error);

        res.status(500).json({
            error: "Error interno al crear la cuenta."
        });
    }
});

// =========================
// IMPORTAR LIBROS DESDE OPEN LIBRARY
// =========================

app.post("/libros/importar-openlibrary", async (req, res) => {
    try {
        const { buscar } = req.body;

        if (!buscar) {
            return res.status(400).json({
                error: "Debes proporcionar un término de búsqueda."
            });
        }

        const url = "https://openlibrary.org/search.json";

        const response = await axios.get(url, {
            params: {
                q: buscar,
                limit: 50,
                fields: "title,author_name,first_publish_year,isbn,publisher"
            }
        });

        const libros = response.data.docs;
        let importados = 0;
        let omitidos = 0;

        for (const libro of libros) {
            const isbn = libro.isbn ? libro.isbn[0] : null;

            // Solo importar libros que tengan ISBN
            if (!isbn) {
                omitidos++;
                continue;
            }

            const titulo = libro.title || "Sin título";
            const autor = libro.author_name
                ? libro.author_name.join(", ")
                : "Autor desconocido";
            const editorial = libro.publisher
                ? libro.publisher[0]
                : null;
            const anio = libro.first_publish_year || null;

            // Verificar si ya existe
            const existe = await db.query(
                "SELECT isbn FROM libro WHERE isbn = $1",
                [isbn]
            );

            if (existe.rows.length > 0) {
                omitidos++;
                continue;
            }

            await db.query(
                `INSERT INTO libro (isbn, titulo, autor, editorial, version, anio_publicacion, precio)
                 VALUES ($1, $2, $3, $4, NULL, $5, 0)`,
                [isbn, titulo, autor, editorial, anio]
            );

            importados++;
        }

        res.json({
            mensaje: `Importación completada. ${importados} libro(s) importados, ${omitidos} omitidos (sin ISBN o ya existentes).`,
            importados,
            omitidos
        });

    } catch (error) {
        console.error("Error al importar desde Open Library:", error.message);
        res.status(500).json({
            error: "Error al importar libros desde Open Library."
        });
    }
});

// =========================
// PUNTOS DEL CLIENTE
// =========================

// Consultar puntos actuales
app.get("/puntos/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        const result = await db.query(
            "SELECT puntos FROM cliente WHERE correo_electronico = $1",
            [correo]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado." });
        }

        res.json({ puntos: result.rows[0].puntos || 0 });

    } catch (error) {
        console.error("Error al consultar puntos:", error);
        res.status(500).json({ error: "Error al consultar puntos." });
    }
});

// Historial de puntos ganados
app.get("/puntos/:correo/historial", async (req, res) => {
    try {
        const correo = req.params.correo;

        const result = await db.query(
            `
            SELECT hp.puntos_ganados, hp.fecha, v.total_pagado
            FROM historial_puntos hp
            JOIN venta v ON hp.id_venta = v.id_venta
            WHERE hp.correo_cliente = $1
            ORDER BY hp.fecha DESC
            `,
            [correo]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar historial de puntos:", error);
        res.status(500).json({ error: "Error al consultar historial de puntos." });
    }
});

// Canjear puntos (aplicar descuento en una venta)
// 10 puntos = $1 de descuento
app.post("/puntos/canjear", async (req, res) => {
    try {
        const { correo_cliente, puntos_a_canjear } = req.body;

        if (!correo_cliente || !puntos_a_canjear || puntos_a_canjear <= 0) {
            return res.status(400).json({
                error: "Correo del cliente y cantidad de puntos son obligatorios."
            });
        }

        const puntos = Math.floor(Number(puntos_a_canjear));

        // Verificar puntos disponibles
        const result = await db.query(
            "SELECT puntos FROM cliente WHERE correo_electronico = $1",
            [correo_cliente]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado." });
        }

        const puntosDisponibles = result.rows[0].puntos || 0;

        if (puntos > puntosDisponibles) {
            return res.status(400).json({
                error: `El cliente solo tiene ${puntosDisponibles} puntos disponibles.`
            });
        }

        // Descontar puntos
        await db.query(
            "UPDATE cliente SET puntos = puntos - $1 WHERE correo_electronico = $2",
            [puntos, correo_cliente]
        );

        const descuento = (puntos / 10).toFixed(2);

        res.json({
            mensaje: `Se canjearon ${puntos} puntos. Descuento aplicado: $${descuento}`,
            puntos_canjeados: puntos,
            descuento: Number(descuento),
            puntos_restantes: puntosDisponibles - puntos
        });

    } catch (error) {
        console.error("Error al canjear puntos:", error);
        res.status(500).json({ error: "Error al canjear puntos." });
    }
});

// =========================
// PRÉSTAMOS DEL CLIENTE
// =========================

app.get("/prestamos/cliente/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        const result = await db.query(`
            SELECT
                pr.id_prestamo,
                pr.dia_de_inicio,
                pr.dia_de_vencimiento,
                pr.dia_de_entrega,
                pr.multa,
                pr.cantidad_de_libros,
                lp.isbn,
                l.titulo,
                l.autor,
                CASE
                    WHEN pr.dia_de_entrega IS NOT NULL THEN 'Devuelto'
                    WHEN CURRENT_DATE > pr.dia_de_vencimiento THEN 'Vencido'
                    WHEN (pr.dia_de_vencimiento - CURRENT_DATE) <= 1 THEN 'Por vencer'
                    ELSE 'Activo'
                END AS estado,
                (pr.dia_de_vencimiento - CURRENT_DATE) AS dias_restantes
            FROM prestamo pr
            LEFT JOIN lib_pres lp ON lp.id_prestamo = pr.id_prestamo
            LEFT JOIN libro l ON l.isbn = lp.isbn
            WHERE pr.correo_cliente = $1
            ORDER BY pr.id_prestamo DESC
        `, [correo]);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar préstamos del cliente:", error);
        res.status(500).json({ error: "Error al consultar préstamos." });
    }
});

// =========================
// RECOMENDACIONES DE LIBROS
// =========================

// Recomendar libros basándose en los favoritos y compras del cliente
// Si no está logueado, devuelve libros populares (más vendidos)
app.get("/recomendaciones/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        // Obtener autores de los favoritos del cliente
        const favAutores = await db.query(
            `SELECT DISTINCT autor FROM libro_favorito WHERE correo_cliente = $1 AND autor IS NOT NULL`,
            [correo]
        );

        // Obtener autores de libros que ha comprado (via ventas asociadas)
        const compraAutores = await db.query(
            `SELECT DISTINCT l.autor
             FROM venta v
             JOIN historial_puntos hp ON hp.id_venta = v.id_venta AND hp.correo_cliente = $1
             JOIN lib_venta lv ON lv.id_venta = v.id_venta
             JOIN libro l ON l.isbn = lv.isbn
             WHERE l.autor IS NOT NULL`,
            [correo]
        );

        // Obtener autores de préstamos del cliente
        const presAutores = await db.query(
            `SELECT DISTINCT l.autor
             FROM prestamo p
             JOIN lib_pres lp ON lp.id_prestamo = p.id_prestamo
             JOIN libro l ON l.isbn = lp.isbn
             WHERE p.correo_cliente = $1 AND l.autor IS NOT NULL`,
            [correo]
        );

        // Combinar todos los autores
        const autoresSet = new Set();
        [...favAutores.rows, ...compraAutores.rows, ...presAutores.rows].forEach(r => {
            if (r.autor) autoresSet.add(r.autor);
        });

        const autores = Array.from(autoresSet);

        let recomendaciones = [];

        if (autores.length > 0) {
            // Buscar libros de esos autores que el cliente NO tiene en favoritos
            const placeholders = autores.map((_, i) => `$${i + 2}`).join(", ");
            const result = await db.query(
                `SELECT l.isbn, l.titulo, l.autor, l.editorial, l.precio
                 FROM libro l
                 WHERE l.autor IN (${placeholders})
                 AND l.isbn NOT IN (
                     SELECT isbn FROM libro_favorito WHERE correo_cliente = $1
                 )
                 ORDER BY RANDOM()
                 LIMIT 12`,
                [correo, ...autores]
            );
            recomendaciones = result.rows;
        }

        // Si no hay suficientes, completar con libros populares
        if (recomendaciones.length < 12) {
            const faltan = 12 - recomendaciones.length;
            const isbnExcluir = recomendaciones.map(r => r.isbn);
            const excludePlaceholders = isbnExcluir.length > 0
                ? `AND l.isbn NOT IN (${isbnExcluir.map((_, i) => `$${i + 1}`).join(", ")})`
                : "";

            const populares = await db.query(
                `SELECT l.isbn, l.titulo, l.autor, l.editorial, l.precio
                 FROM libro l
                 WHERE l.precio > 0 ${excludePlaceholders}
                 ORDER BY RANDOM()
                 LIMIT $${isbnExcluir.length + 1}`,
                [...isbnExcluir, faltan]
            );

            recomendaciones = [...recomendaciones, ...populares.rows];
        }

        res.json(recomendaciones);

    } catch (error) {
        console.error("Error al generar recomendaciones:", error);
        res.status(500).json({ error: "Error al generar recomendaciones." });
    }
});

// Recomendaciones generales (sin login)
app.get("/recomendaciones", async (req, res) => {
    try {
        const result = await db.query(
            `SELECT isbn, titulo, autor, editorial, precio
             FROM libro
             WHERE precio > 0
             ORDER BY RANDOM()
             LIMIT 12`
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Error al obtener recomendaciones:", error);
        res.status(500).json({ error: "Error al obtener recomendaciones." });
    }
});

// =========================
// DONACIONES DE LIBROS
// =========================

// Registrar donación (el bibliotecario registra que un cliente dona libros)
// Opciones: recibir 20 puntos por libro O intercambiar por otro libro donado
app.post("/donaciones", async (req, res) => {
    try {
        const { correo_cliente, isbn, titulo, autor, cantidad, tipo_recompensa, isbn_intercambio } = req.body;

        if (!correo_cliente || !isbn || !titulo || !cantidad || cantidad < 1) {
            return res.status(400).json({
                error: "Correo del cliente, ISBN, título y cantidad son obligatorios."
            });
        }

        if (!tipo_recompensa || !["puntos", "intercambio"].includes(tipo_recompensa)) {
            return res.status(400).json({
                error: "Debes elegir el tipo de recompensa: puntos o intercambio."
            });
        }

        // Verificar que el cliente existe
        const clienteExiste = await db.query(
            "SELECT correo_electronico FROM cliente WHERE correo_electronico = $1",
            [correo_cliente]
        );

        if (clienteExiste.rows.length === 0) {
            return res.status(404).json({ error: "El cliente no está registrado." });
        }

        const cantidadNum = Math.floor(Number(cantidad));

        // Si es intercambio, verificar que el libro solicitado existe en donaciones disponibles
        if (tipo_recompensa === "intercambio") {
            if (!isbn_intercambio) {
                return res.status(400).json({ error: "Debes seleccionar un libro para el intercambio." });
            }

            const stockDonado = await db.query(
                `SELECT cantidad FROM lib_venta WHERE isbn = $1 AND id_venta IS NULL`,
                [isbn_intercambio]
            );

            if (stockDonado.rows.length === 0 || stockDonado.rows[0].cantidad < 1) {
                return res.status(400).json({ error: "El libro seleccionado para intercambio no tiene stock disponible." });
            }
        }

        await db.query("BEGIN");

        let puntosOtorgados = 0;

        if (tipo_recompensa === "puntos") {
            puntosOtorgados = cantidadNum * 20;

            // Sumar puntos al cliente
            await db.query(
                "UPDATE cliente SET puntos = puntos + $1 WHERE correo_electronico = $2",
                [puntosOtorgados, correo_cliente]
            );
        } else {
            // Intercambio: descontar 1 unidad del libro solicitado
            await db.query(
                "UPDATE lib_venta SET cantidad = cantidad - 1 WHERE isbn = $1 AND id_venta IS NULL",
                [isbn_intercambio]
            );
        }

        // Registrar la donación
        await db.query(
            `INSERT INTO donacion (correo_cliente, isbn, titulo, autor, cantidad, puntos_otorgados)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [correo_cliente, isbn, titulo, autor || null, cantidadNum, puntosOtorgados]
        );

        // Agregar el libro donado a la base si no existe
        const libroExiste = await db.query(
            "SELECT isbn FROM libro WHERE isbn = $1",
            [isbn]
        );

        if (libroExiste.rows.length === 0) {
            await db.query(
                `INSERT INTO libro (isbn, titulo, autor, editorial, version, anio_publicacion, precio)
                 VALUES ($1, $2, $3, NULL, NULL, NULL, 0)`,
                [isbn, titulo, autor || "Autor desconocido"]
            );
        }

        // Agregar stock para venta
        const stockVenta = await db.query(
            "SELECT cantidad FROM lib_venta WHERE isbn = $1 AND id_venta IS NULL",
            [isbn]
        );

        if (stockVenta.rows.length > 0) {
            await db.query(
                "UPDATE lib_venta SET cantidad = cantidad + $1 WHERE isbn = $2 AND id_venta IS NULL",
                [cantidadNum, isbn]
            );
        } else {
            await db.query(
                "INSERT INTO lib_venta (cantidad, id_venta, isbn) VALUES ($1, NULL, $2)",
                [cantidadNum, isbn]
            );
        }

        // Agregar stock para préstamo
        const stockPres = await db.query(
            "SELECT cantidad FROM lib_pres WHERE isbn = $1 AND id_prestamo IS NULL",
            [isbn]
        );

        if (stockPres.rows.length > 0) {
            await db.query(
                "UPDATE lib_pres SET cantidad = cantidad + $1 WHERE isbn = $2 AND id_prestamo IS NULL",
                [cantidadNum, isbn]
            );
        } else {
            await db.query(
                "INSERT INTO lib_pres (cantidad, id_prestamo, isbn) VALUES ($1, NULL, $2)",
                [cantidadNum, isbn]
            );
        }

        await db.query("COMMIT");

        if (tipo_recompensa === "puntos") {
            res.json({
                mensaje: `Donación registrada. El cliente recibió ${puntosOtorgados} puntos.`,
                puntos_otorgados: puntosOtorgados,
                tipo: "puntos"
            });
        } else {
            res.json({
                mensaje: `Donación registrada. El cliente recibió un libro a cambio.`,
                tipo: "intercambio",
                isbn_intercambio
            });
        }

    } catch (error) {
        await db.query("ROLLBACK");
        console.error("Error al registrar donación:", error);
        res.status(500).json({ error: "Error al registrar la donación." });
    }
});

// Consultar libros disponibles para intercambio (solo libros que han sido donados)
app.get("/donaciones/libros-disponibles", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT d.isbn, d.titulo, d.autor, SUM(d.cantidad) AS total_donado
            FROM donacion d
            GROUP BY d.isbn, d.titulo, d.autor
            HAVING SUM(d.cantidad) > 0
            ORDER BY d.titulo
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar libros disponibles:", error);
        res.status(500).json({ error: "Error al consultar libros disponibles." });
    }
});

// Consultar donaciones de un cliente
app.get("/donaciones/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        const result = await db.query(
            `SELECT id_donacion, isbn, titulo, autor, cantidad, puntos_otorgados, fecha
             FROM donacion
             WHERE correo_cliente = $1
             ORDER BY fecha DESC`,
            [correo]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar donaciones:", error);
        res.status(500).json({ error: "Error al consultar donaciones." });
    }
});

// =========================
// LIBROS FAVORITOS
// =========================

// Consultar favoritos de un cliente
app.get("/favoritos/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        const result = await db.query(
            `
            SELECT isbn, titulo, autor, fecha_agregado
            FROM libro_favorito
            WHERE correo_cliente = $1
            ORDER BY fecha_agregado DESC
            `,
            [correo]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar favoritos:", error);
        res.status(500).json({ error: "Error al consultar favoritos." });
    }
});

// Agregar libro a favoritos
app.post("/favoritos", async (req, res) => {
    try {
        const { correo_cliente, isbn, titulo, autor } = req.body;

        if (!correo_cliente || !isbn || !titulo) {
            return res.status(400).json({
                error: "Correo, ISBN y título son obligatorios."
            });
        }

        // Verificar que el cliente existe
        const existe = await db.query(
            "SELECT correo_electronico FROM cliente WHERE correo_electronico = $1",
            [correo_cliente]
        );

        if (existe.rows.length === 0) {
            return res.status(404).json({ error: "El cliente no existe." });
        }

        await db.query(
            `
            INSERT INTO libro_favorito (correo_cliente, isbn, titulo, autor)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (correo_cliente, isbn) DO NOTHING
            `,
            [correo_cliente, isbn, titulo, autor || null]
        );

        res.json({ mensaje: "Libro agregado a favoritos." });

    } catch (error) {
        console.error("Error al agregar favorito:", error);
        res.status(500).json({ error: "Error al agregar favorito." });
    }
});

// Eliminar libro de favoritos
app.delete("/favoritos/:correo/:isbn", async (req, res) => {
    try {
        const { correo, isbn } = req.params;

        await db.query(
            `
            DELETE FROM libro_favorito
            WHERE correo_cliente = $1 AND isbn = $2
            `,
            [correo, isbn]
        );

        res.json({ mensaje: "Libro eliminado de favoritos." });

    } catch (error) {
        console.error("Error al eliminar favorito:", error);
        res.status(500).json({ error: "Error al eliminar favorito." });
    }
});

// =========================
// SERVIDOR
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});