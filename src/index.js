// =========================================================
// ARCHIVO: index.js
// Descripción: Servidor principal de la aplicación ABV Library.
// Contiene todas las rutas (endpoints) de la API REST para:
// - Autenticación (login unificado, admin, vendedor, cliente)
// - Gestión de libros (CRUD, importación desde Open Library)
// - Control de stock (venta y préstamo)
// - Proveedores (CRUD, suministro de libros, recepción de paquetes)
// - Empleados (CRUD con roles)
// - Ventas y préstamos (registro, consulta, devolución)
// - Facturas y reportes financieros
// - Clientes (CRUD, registro público)
// - Sistema de puntos (acumulación, historial, canje)
// - Donaciones de libros (con recompensa por puntos o intercambio)
// - Recomendaciones personalizadas de libros
// - Libros favoritos del cliente
// =========================================================

// =========================================================
// SECCIÓN: CONFIGURACIÓN Y DEPENDENCIAS
// Carga de variables de entorno, módulos necesarios y
// configuración inicial del servidor Express
// =========================================================

// Carga las variables del archivo .env (credenciales, puerto, etc.)
require("dotenv").config();
const express = require("express");
// CORS permite que el frontend haga peticiones al backend desde otro origen
const cors = require("cors");
const path = require("path");
// Axios se usa para hacer peticiones HTTP a APIs externas (Open Library)
const axios = require("axios");
// bcrypt se usa para hashear contraseñas de forma segura (algoritmo de una vía)
// Esto evita almacenar contraseñas en texto plano en la base de datos
const bcrypt = require("bcrypt");
// Módulo de conexión a la base de datos PostgreSQL
const db = require("./db");

// Número de rondas de sal para bcrypt (mayor = más seguro pero más lento)
const SALT_ROUNDS = 10;

// Función auxiliar para validar formato de correo electrónico con expresión regular
function esCorreoValido(correo) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
}

// Función auxiliar para validar que un nombre solo contenga letras, espacios y acentos
function esNombreValido(nombre) {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    return regex.test(nombre);
}

// Inicialización de la aplicación Express
const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
// Sirve archivos estáticos (HTML, CSS, JS del frontend) desde la carpeta public
app.use(express.static(path.join(__dirname, "../public")));


// =========================================================
// SECCIÓN: LOGIN UNIFICADO
// Endpoint principal de autenticación que identifica el rol
// del usuario (admin, bibliotecario, cliente) y devuelve
// los roles disponibles para seleccionar panel de acceso
// =========================================================

app.post("/login", async (req, res) => {
    try {
        const { correo_electronico, password } = req.body;

        // Validación: ambos campos son requeridos
        if (!correo_electronico || !password) {
            return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
        }

        // Validación: formato de correo válido
        if (!esCorreoValido(correo_electronico)) {
            return res.status(400).json({ error: "El correo no tiene un formato válido." });
        }

        // Buscar persona en la base de datos por correo
        // Retorna: datos básicos + hash de contraseña + flag de cambio obligatorio
        const persona = await db.query(
            "SELECT correo_electronico, nombre, ap_paterno, contrasena_hash, debe_cambiar_contrasena FROM persona WHERE correo_electronico = $1",
            [correo_electronico]
        );

        // Si no existe la persona, devolver error genérico (no revelar si el correo existe)
        if (persona.rows.length === 0) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos." });
        }

        const user = persona.rows[0];

        // Verificar que el usuario tenga contraseña configurada
        if (!user.contrasena_hash) {
            return res.status(401).json({ error: "Este usuario no tiene contraseña configurada." });
        }

        // Comparar contraseña ingresada con el hash almacenado usando bcrypt
        const coincide = await bcrypt.compare(password, user.contrasena_hash);
        if (!coincide) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos." });
        }

        // Determinar todos los roles disponibles para este usuario
        const roles = [];

        // Verificar si es empleado y qué rol tiene
        const empleado = await db.query(
            "SELECT rol FROM empleado WHERE correo_electronico = $1",
            [correo_electronico]
        );
        if (empleado.rows.length > 0) {
            const rol = empleado.rows[0].rol;
            // Administrador y Dueño tienen acceso al panel de admin
            if (["Administrador", "Dueno"].includes(rol)) {
                roles.push({ tipo: "admin", label: "Administrador", rol });
            }
            // Todos los empleados tienen acceso al panel de bibliotecario/vendedor
            if (["Vendedor", "Bibliotecario", "Administrador", "Dueno"].includes(rol)) {
                roles.push({ tipo: "bibliotecario", label: "Bibliotecario", rol });
            }
        }

        // Verificar si es cliente registrado
        const cliente = await db.query(
            "SELECT correo_electronico, fecha_de_registro FROM cliente WHERE correo_electronico = $1",
            [correo_electronico]
        );
        if (cliente.rows.length > 0) {
            roles.push({ tipo: "cliente", label: "Cliente" });
        }

        // Si no tiene ningún rol asignado, no puede acceder
        if (roles.length === 0) {
            return res.status(401).json({ error: "No tienes un rol asignado en el sistema." });
        }

        // Respuesta exitosa con datos del usuario y roles disponibles
        res.json({
            acceso: true,
            nombre: user.nombre,
            ap_paterno: user.ap_paterno,
            correo_electronico: user.correo_electronico,
            debe_cambiar_contrasena: user.debe_cambiar_contrasena || false,
            roles
        });

    } catch (error) {
        console.error("Error en login unificado:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

// =========================================================
// SECCIÓN: LOGIN ADMIN
// Autenticación especial para el panel de administración
// usando contraseña maestra almacenada en variables de entorno
// =========================================================

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

        // Comparar contraseña con el hash almacenado en .env
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


// =========================================================
// SECCIÓN: CONSULTAR LIBROS LOCALES
// Búsqueda de libros en la base de datos local con filtro
// por ISBN, título, autor o editorial (búsqueda parcial)
// =========================================================

app.get("/libros", async (req, res) => {
    try {
        const buscar = req.query.buscar || "";

        // Consulta con ILIKE para búsqueda insensible a mayúsculas/minúsculas
        // Busca coincidencias parciales en isbn, titulo, autor o editorial
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
            LIMIT 50
        `;

        // El comodín % permite coincidencias parciales (contiene el texto)
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

// =========================================================
// SECCIÓN: API EXTERNA (OPEN LIBRARY)
// Consulta a la API pública de Open Library para buscar
// libros que no están en la base de datos local
// =========================================================

app.get("/api/libros-externos", async (req, res) => {
    try {
        const buscar = req.query.buscar || "programacion";

        const url = "https://openlibrary.org/search.json";

        // Petición a Open Library con filtros de idioma español y límite de 20 resultados
        const response = await axios.get(url, {
            params: {
                q: buscar,
                language: "spa",
                limit: 20,
                fields: "title,author_name,first_publish_year,isbn,publisher"
            },
            timeout: 15000
        });

        // Mapear la respuesta de Open Library al formato interno de la aplicación
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


// =========================================================
// SECCIÓN: AGREGAR LIBRO
// Registra un nuevo libro en la base de datos local
// Valida que el ISBN no exista previamente (clave única)
// =========================================================

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

        // Validación: campos mínimos obligatorios
        if (!isbn || !titulo || !autor) {
            return res.status(400).json({
                error: "ISBN, título y autor son obligatorios."
            });
        }

        // Verificar que el ISBN no exista ya en la base de datos
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

        // Insertar el nuevo libro con valores opcionales (null si no se proporcionan)
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


// =========================================================
// SECCIÓN: STOCK
// Consulta el inventario de libros mostrando las cantidades
// disponibles para venta y para préstamo por separado.
// El stock se calcula desde lib_venta y lib_pres donde
// id_venta/id_prestamo es NULL (unidades no asignadas)
// =========================================================

app.get("/stock", async (req, res) => {
    try {
        // Subconsultas correlacionadas para obtener stock disponible:
        // - lib_venta con id_venta NULL = unidades disponibles para vender
        // - lib_pres con id_prestamo NULL = unidades disponibles para prestar
        const result = await db.query(`
            SELECT
                l.isbn,
                l.titulo,
                l.autor,
                l.editorial,
                l.version,
                l.anio_publicacion,
                l.precio,
                COALESCE((SELECT SUM(cantidad) FROM lib_venta WHERE isbn = l.isbn AND id_venta IS NULL), 0) AS stock_venta,
                COALESCE((SELECT SUM(cantidad) FROM lib_pres WHERE isbn = l.isbn AND id_prestamo IS NULL), 0) AS stock_prestamo
            FROM libro l
            ORDER BY l.titulo
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar stock:", error);
        res.status(500).json({ error: "Error al consultar stock." });
    }
});

// =========================================================
// SECCIÓN: PROVEEDORES (CRUD + SUMINISTRO + RECEPCIÓN)
// Gestión completa de proveedores: crear, consultar,
// actualizar, eliminar, asignar libros que suministran
// y registrar la recepción de paquetes (suma stock)
// =========================================================

// --- Consultar todos los proveedores ---
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

// --- Agregar un nuevo proveedor ---
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

// --- Actualizar nombre de un proveedor ---
app.put("/proveedores/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: "El nombre es obligatorio." });
        }

        // RETURNING * permite verificar si se actualizó algún registro
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

// --- Eliminar un proveedor ---
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

// --- Consultar relación proveedor-libro (qué libros suministra cada proveedor) ---
app.get("/proveedores-libros", async (req, res) => {
    try {
        // JOIN entre prov_suministra_lib, proveedor y libro para obtener datos completos
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

// --- Asignar un libro a un proveedor (crear relación de suministro) ---
app.post("/proveedores-libros", async (req, res) => {
    try {
        const { id_proveedor, isbn } = req.body;

        if (!id_proveedor || !isbn) {
            return res.status(400).json({ error: "Proveedor e ISBN son obligatorios." });
        }

        // Verificar que no exista ya la relación para evitar duplicados
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

// --- Recibir paquete de libros de un proveedor (suma stock) ---
// Este endpoint registra la llegada de libros y distribuye las unidades
// entre stock de venta y stock de préstamo según lo indicado
app.post("/proveedores/recibir-paquete", async (req, res) => {
    try {
        const { id_proveedor, isbn, cantidad, cantidad_venta, cantidad_prestamo, costo_total } = req.body;

        // Validaciones básicas de campos obligatorios
        if (!id_proveedor || !isbn || !cantidad || cantidad < 1) {
            return res.status(400).json({ error: "Proveedor, ISBN y cantidad son obligatorios." });
        }

        if (costo_total === undefined || costo_total === null || Number(costo_total) < 0) {
            return res.status(400).json({ error: "El costo total del paquete es obligatorio." });
        }

        // Verificar que el proveedor tenga asignado ese libro (relación de suministro)
        const relacion = await db.query(
            "SELECT 1 FROM prov_suministra_lib WHERE id_proveedor = $1 AND isbn = $2",
            [id_proveedor, isbn]
        );

        if (relacion.rows.length === 0) {
            return res.status(400).json({ error: "Este proveedor no suministra ese libro. Asígnalo primero." });
        }

        // Convertir a enteros para evitar decimales en cantidades
        const cantidadNum = Math.floor(Number(cantidad));
        const cantVenta = Math.floor(Number(cantidad_venta) || 0);
        const cantPrestamo = Math.floor(Number(cantidad_prestamo) || 0);

        // Validar que la distribución venta + préstamo sume el total recibido
        if ((cantVenta + cantPrestamo) !== cantidadNum) {
            return res.status(400).json({
                error: `Las unidades para venta (${cantVenta}) + préstamo (${cantPrestamo}) deben sumar ${cantidadNum}.`
            });
        }

        // Transacción: todas las operaciones deben completarse o ninguna
        await db.query("BEGIN");

        // Registrar la recepción en el historial para reportes financieros
        await db.query(
            "INSERT INTO recepcion_paquete (id_proveedor, isbn, cantidad, costo_total) VALUES ($1, $2, $3, $4)",
            [id_proveedor, isbn, cantidadNum, Number(costo_total)]
        );

        // Sumar stock para venta (actualizar si ya existe, insertar si no)
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

        // Sumar stock para préstamo (misma lógica: actualizar o insertar)
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

// --- Consultar libros que suministra un proveedor específico ---
app.get("/proveedores/:id/libros", async (req, res) => {
    try {
        const { id } = req.params;

        // Retorna los libros asociados a un proveedor mediante la tabla intermedia
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

// =========================================================
// SECCIÓN: EMPLEADOS (CRUD)
// Gestión de empleados: consultar, agregar, actualizar y
// eliminar. Cada empleado tiene un rol (Vendedor,
// Bibliotecario, Administrador, Dueno) y una contraseña
// temporal que debe cambiar en su primer inicio de sesión
// =========================================================

// --- Consultar todos los empleados ---
app.get("/empleados", async (req, res) => {
    try {
        // JOIN entre persona y empleado para obtener datos personales + rol
        // tiene_password indica si ya configuró su contraseña
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

// --- Agregar un nuevo empleado ---
// Se crea con contraseña temporal (nombre+1234) y flag debe_cambiar_contrasena=TRUE
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

        // Validación de campos obligatorios
        if (!correo_electronico || !nombre || !ap_paterno || !fecha_de_nacimiento || !rol) {
            return res.status(400).json({
                error: "Correo, nombre, apellido paterno, fecha de nacimiento y rol son obligatorios."
            });
        }

        // Validar formato de correo
        if (!esCorreoValido(correo_electronico)) {
            return res.status(400).json({
                error: "El correo electrónico no tiene un formato válido."
            });
        }

        // Validar que nombres no contengan números
        if (!esNombreValido(nombre)) {
            return res.status(400).json({ error: "El nombre solo puede contener letras y espacios." });
        }
        if (!esNombreValido(ap_paterno)) {
            return res.status(400).json({ error: "El apellido paterno solo puede contener letras y espacios." });
        }
        if (ap_materno && !esNombreValido(ap_materno)) {
            return res.status(400).json({ error: "El apellido materno solo puede contener letras y espacios." });
        }

        // Verificar que no exista otra persona con ese correo
        const existePersona = await db.query(
            "SELECT correo_electronico FROM persona WHERE correo_electronico = $1",
            [correo_electronico]
        );

        if (existePersona.rows.length > 0) {
            return res.status(409).json({
                error: "Ya existe una persona con ese correo."
            });
        }

        // Generar contraseña temporal: nombre en minúsculas sin espacios + "1234"
        // El empleado deberá cambiarla en su primer inicio de sesión
        const passwordPredefinida = nombre.toLowerCase().replace(/\s/g, '') + "1234";
        const contrasena_hash = await bcrypt.hash(passwordPredefinida, SALT_ROUNDS);

        // Transacción: insertar en persona y empleado de forma atómica
        await db.query("BEGIN");

        await db.query(
            `INSERT INTO persona (
                correo_electronico, nombre, ap_paterno, ap_materno,
                fecha_de_nacimiento, telefono, contrasena_hash, debe_cambiar_contrasena
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
            [
                correo_electronico, nombre, ap_paterno,
                ap_materno || null, fecha_de_nacimiento,
                telefono || null, contrasena_hash
            ]
        );

        await db.query(
            `INSERT INTO empleado (correo_electronico, rol) VALUES ($1, $2)`,
            [correo_electronico, rol]
        );

        await db.query("COMMIT");

        res.json({
            mensaje: `Empleado agregado. Contraseña temporal: ${passwordPredefinida}`
        });

    } catch (error) {
        await db.query("ROLLBACK");

        console.error("Error al agregar empleado:", error);

        res.status(500).json({
            error: "Error interno al agregar empleado."
        });
    }
});

// --- Actualizar datos de un empleado ---
app.put("/empleados/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;
        const { nombre, ap_paterno, ap_materno, fecha_de_nacimiento, telefono, rol } = req.body;

        if (!nombre || !ap_paterno || !fecha_de_nacimiento || !rol) {
            return res.status(400).json({ error: "Nombre, apellido paterno, fecha de nacimiento y rol son obligatorios." });
        }

        // Transacción: actualizar datos personales en persona y rol en empleado
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

// --- Eliminar un empleado ---
// Al eliminar de persona, se elimina en cascada de empleado (FK)
app.delete("/empleados/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        // Verificar que el empleado existe antes de intentar eliminar
        const existe = await db.query(
            "SELECT correo_electronico FROM empleado WHERE correo_electronico = $1",
            [correo]
        );

        if (existe.rows.length === 0) {
            return res.status(404).json({ error: "El empleado no existe." });
        }

        // Eliminar de persona (cascada elimina de empleado automáticamente)
        await db.query("DELETE FROM persona WHERE correo_electronico = $1", [correo]);

        res.json({ mensaje: "Empleado eliminado correctamente." });

    } catch (error) {
        console.error("Error al eliminar empleado:", error);
        res.status(500).json({ error: "Error interno al eliminar empleado." });
    }
});

// =========================================================
// SECCIÓN: LOGIN VENDEDOR / BIBLIOTECARIO
// Autenticación para empleados con roles de Vendedor,
// Bibliotecario, Administrador o Dueño. Permite acceso
// al panel de operaciones (ventas, préstamos, etc.)
// =========================================================

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

        // Buscar empleado con rol autorizado para el panel de bibliotecario
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

        // Verificar contraseña con bcrypt
        const coincide = await bcrypt.compare(password, empleado.contrasena_hash);

        if (!coincide) {
            return res.status(401).json({
                acceso: false,
                error: "Correo o contraseña incorrectos."
            });
        }

        // No devolver el hash al cliente por seguridad (desestructuración)
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

// =========================================================
// SECCIÓN: LOGIN CLIENTE
// Autenticación para clientes registrados. Verifica
// credenciales y devuelve datos del cliente sin el hash
// =========================================================

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

        // Buscar cliente: JOIN persona + cliente para verificar que sea cliente registrado
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

        // Verificar contraseña con bcrypt
        const coincide = await bcrypt.compare(password, cliente.contrasena_hash);

        if (!coincide) {
            return res.status(401).json({
                acceso: false,
                error: "Correo o contraseña incorrectos."
            });
        }

        // Excluir el hash de la respuesta por seguridad
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

// =========================================================
// SECCIÓN: CAMBIAR CONTRASEÑA
// Permite a cualquier usuario cambiar su contraseña.
// Si es el primer cambio obligatorio (debe_cambiar_contrasena=TRUE),
// no se requiere la contraseña actual. En cambios posteriores
// sí se valida la contraseña actual antes de permitir el cambio.
// =========================================================

app.put("/usuarios/:correo/password", async (req, res) => {
    try {
        const { correo } = req.params;
        const { password_actual, password_nueva } = req.body;

        // La nueva contraseña debe tener mínimo 8 caracteres
        if (!password_nueva || password_nueva.length < 8) {
            return res.status(400).json({
                error: "La nueva contraseña debe tener al menos 8 caracteres."
            });
        }

        // Obtener hash actual y flag de cambio obligatorio
        const result = await db.query(
            "SELECT contrasena_hash, debe_cambiar_contrasena FROM persona WHERE correo_electronico = $1",
            [correo]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        const hashActual = result.rows[0].contrasena_hash;
        const esPrimerCambio = result.rows[0].debe_cambiar_contrasena;

        // Si es primer cambio obligatorio, no pedir contraseña actual
        // (el empleado nuevo solo conoce la temporal generada por el sistema)
        if (hashActual && !esPrimerCambio) {
            if (!password_actual) {
                return res.status(400).json({ error: "Debes proporcionar la contraseña actual." });
            }
            // Verificar que la contraseña actual sea correcta
            const coincide = await bcrypt.compare(password_actual, hashActual);
            if (!coincide) {
                return res.status(401).json({ error: "La contraseña actual es incorrecta." });
            }
        }

        // Hashear la nueva contraseña y actualizar en la base de datos
        const nuevoHash = await bcrypt.hash(password_nueva, SALT_ROUNDS);

        // Actualizar hash y desactivar flag de cambio obligatorio
        await db.query(
            "UPDATE persona SET contrasena_hash = $1, debe_cambiar_contrasena = FALSE WHERE correo_electronico = $2",
            [nuevoHash, correo]
        );

        res.json({ mensaje: "Contraseña actualizada correctamente." });

    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        res.status(500).json({ error: "Error interno al cambiar contraseña." });
    }
});

// =========================================================
// SECCIÓN: VENTAS
// Consultar historial de ventas y registrar nuevas ventas.
// Al registrar una venta se descuenta stock, se genera
// registro en lib_venta y se suman puntos al cliente
// si la venta está asociada a uno.
// =========================================================

// --- Consultar todas las ventas ---
app.get("/ventas", async (req, res) => {
    try {
        // Retorna ventas con datos del vendedor (nombre + rol)
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

// --- Registrar una nueva venta ---
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

        // Validación de campos obligatorios para la venta
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

        // Si se asocia un cliente, verificar que exista en la base de datos
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

        // Verificar que hay suficiente stock disponible para venta
        // (registros en lib_venta con id_venta NULL = stock no vendido)
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

        // Insertar el registro de la venta con fecha y hora actuales
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

        // Registrar qué libro y cantidad se vendió (detalle de la venta)
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

        // Descontar del stock disponible (restar de la fila con id_venta NULL)
        await db.query(
    `
    UPDATE lib_venta
    SET cantidad = cantidad - $1
    WHERE isbn = $2
    AND id_venta IS NULL
    `,
    [cantidad, isbn]
);

        // Sistema de puntos: por cada $10 de compra, el cliente gana 1 punto
        let puntosGanados = 0;
        if (correo_cliente) {
            puntosGanados = Math.floor(Number(total_pagado) / 10);
            if (puntosGanados > 0) {
                // Sumar puntos al saldo del cliente
                await db.query(
                    `UPDATE cliente SET puntos = puntos + $1 WHERE correo_electronico = $2`,
                    [puntosGanados, correo_cliente]
                );
                // Registrar en historial para trazabilidad
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

// =========================================================
// SECCIÓN: PRÉSTAMOS
// Registro, consulta y devolución de préstamos de libros.
// Al prestar se descuenta stock de préstamo. Al devolver
// se calcula multa si hay retraso ($10 por día de atraso).
// =========================================================

// --- Registrar un nuevo préstamo ---
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

        // Verificar stock disponible para préstamo (lib_pres con id_prestamo NULL)
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

        // Crear el registro del préstamo con multa inicial en 0
        // dia_de_entrega queda NULL hasta que se devuelva
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

        // Registrar detalle: qué libro y cantidad se prestó
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

        // Descontar del stock disponible para préstamo
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

// --- Consultar todos los préstamos ---
app.get("/prestamos", async (req, res) => {

    try {
        // Consulta con estado calculado dinámicamente:
        // - Devuelto: si dia_de_entrega no es NULL
        // - Vencido: si la fecha actual supera dia_de_vencimiento
        // - Activo: en cualquier otro caso
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

// --- Devolver un préstamo ---
// Calcula multa automáticamente: $10 por cada día de retraso
app.put("/prestamos/:id/devolver", async (req, res) => {
    try {
        const id_prestamo = req.params.id;

        // Verificar que el préstamo existe y no ha sido devuelto
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

        // Actualizar: establecer fecha de entrega y calcular multa
        // Multa = (días de retraso) * $10, o $0 si se devuelve a tiempo
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

// =========================================================
// SECCIÓN: FACTURAS
// Reporte financiero que combina ventas, préstamos y
// recepciones de proveedores en un rango de fechas.
// Usado para generar reportes contables del negocio.
// =========================================================

app.get("/facturas", async (req, res) => {

    try {

        const {
            fecha_inicio,
            fecha_fin
        } = req.query;

        // Ambas fechas son obligatorias para delimitar el reporte
        if (!fecha_inicio || !fecha_fin) {

            return res.status(400).json({

                error:
                    "Fechas obligatorias."

            });

        }

        // Consultar ventas en el rango de fechas (ingresos)
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

        // Consultar préstamos en el rango (multas = ingresos adicionales)
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

        // Consultar recepciones de proveedores (egresos/costos)
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

        // Respuesta con los tres tipos de movimientos financieros
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

// =========================================================
// SECCIÓN: CLIENTES (CRUD + REGISTRO PÚBLICO)
// Gestión de clientes: consultar, agregar (por admin),
// actualizar, eliminar y registro público (auto-registro
// desde la página web sin necesidad de un administrador)
// =========================================================

// --- Consultar todos los clientes ---
app.get("/clientes", async (req, res) => {
    try {
        // JOIN persona + cliente para datos completos incluyendo fecha de registro
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

// --- Agregar cliente (desde panel de administración) ---
// La contraseña es opcional cuando lo agrega un admin
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

        // Validar que nombres no contengan números
        if (!esNombreValido(nombre)) {
            return res.status(400).json({ error: "El nombre solo puede contener letras y espacios." });
        }
        if (!esNombreValido(ap_paterno)) {
            return res.status(400).json({ error: "El apellido paterno solo puede contener letras y espacios." });
        }
        if (ap_materno && !esNombreValido(ap_materno)) {
            return res.status(400).json({ error: "El apellido materno solo puede contener letras y espacios." });
        }

        // Si se proporciona contraseña, validar longitud mínima
        if (password && password.length < 8) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 8 caracteres."
            });
        }

        // Verificar que no exista otra persona con ese correo
        const existePersona = await db.query(
            "SELECT correo_electronico FROM persona WHERE correo_electronico = $1",
            [correo_electronico]
        );

        if (existePersona.rows.length > 0) {
            return res.status(409).json({
                error: "Ya existe una persona con ese correo."
            });
        }

        // Hashear contraseña solo si se proporcionó (puede ser null)
        const contrasena_hash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;

        // Transacción: insertar en persona y cliente
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

// --- Editar un libro (actualizar datos) ---
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

        // Actualizar y retornar el libro modificado para confirmar cambios
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

// --- Eliminar un libro ---
app.delete("/libros/:isbn", async (req, res) => {
    try {
        const { isbn } = req.params;

        // Verificar que el libro existe
        const existe = await db.query("SELECT isbn FROM libro WHERE isbn = $1", [isbn]);
        if (existe.rows.length === 0) {
            return res.status(404).json({ error: "El libro no existe." });
        }

        // Eliminar registros relacionados primero
        await db.query("DELETE FROM lib_venta WHERE isbn = $1", [isbn]);
        await db.query("DELETE FROM lib_pres WHERE isbn = $1", [isbn]);
        await db.query("DELETE FROM libro_favorito WHERE isbn = $1", [isbn]);
        await db.query("DELETE FROM prov_suministra_lib WHERE isbn = $1", [isbn]);
        await db.query("DELETE FROM donacion WHERE isbn = $1", [isbn]);
        await db.query("DELETE FROM libro WHERE isbn = $1", [isbn]);

        res.json({ mensaje: "Libro eliminado correctamente." });

    } catch (error) {
        console.error("Error al eliminar libro:", error);
        res.status(500).json({ error: "Error al eliminar libro." });
    }
});

// --- Actualizar datos de un cliente ---
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

        // Actualizar datos personales en la tabla persona
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

// --- Eliminar un cliente ---
// Al eliminar de persona, se elimina en cascada de cliente (FK)
// Puede fallar si tiene préstamos activos (integridad referencial)
app.delete("/clientes/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        // Verificar que el cliente existe
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

        // Eliminar de persona (cascada elimina de cliente)
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

// --- Registro público de cliente (auto-registro desde la web) ---
// A diferencia de POST /clientes, aquí la contraseña es obligatoria
// porque el cliente se registra a sí mismo
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

        // Todos los campos principales son obligatorios en auto-registro
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

        // Validar que nombres y apellidos no contengan números ni caracteres especiales
        if (!esNombreValido(nombre)) {
            return res.status(400).json({ error: "El nombre solo puede contener letras y espacios." });
        }
        if (!esNombreValido(ap_paterno)) {
            return res.status(400).json({ error: "El apellido paterno solo puede contener letras y espacios." });
        }
        if (ap_materno && !esNombreValido(ap_materno)) {
            return res.status(400).json({ error: "El apellido materno solo puede contener letras y espacios." });
        }

        // Validar longitud mínima de contraseña por seguridad
        if (password.length < 8) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 8 caracteres."
            });
        }

        // Verificar que el correo no esté ya registrado
        const existePersona = await db.query(
            "SELECT correo_electronico FROM persona WHERE correo_electronico = $1",
            [correo_electronico]
        );

        if (existePersona.rows.length > 0) {
            return res.status(409).json({
                error: "Ya existe una cuenta con ese correo electrónico."
            });
        }

        // Hashear la contraseña antes de almacenarla (nunca guardar en texto plano)
        const contrasena_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // Transacción: crear persona y cliente de forma atómica
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

// =========================================================
// SECCIÓN: IMPORTAR LIBROS DESDE OPEN LIBRARY
// Importación masiva de libros desde la API de Open Library.
// Busca libros por término y los inserta en la base local
// si tienen ISBN y no existen previamente.
// =========================================================

app.post("/libros/importar-openlibrary", async (req, res) => {
    try {
        const { buscar } = req.body;

        if (!buscar) {
            return res.status(400).json({
                error: "Debes proporcionar un término de búsqueda."
            });
        }

        const url = "https://openlibrary.org/search.json";

        // Buscar hasta 50 libros en Open Library
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

            // Solo importar libros que tengan ISBN (es la clave primaria)
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
            const anio = libro.first_publish_year ? `${libro.first_publish_year}-01-01` : null;

            // Verificar si ya existe en la base local para evitar duplicados
            const existe = await db.query(
                "SELECT isbn FROM libro WHERE isbn = $1",
                [isbn]
            );

            if (existe.rows.length > 0) {
                omitidos++;
                continue;
            }

            // Insertar con precio 0 (se debe actualizar manualmente después)
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

// =========================================================
// SECCIÓN: PUNTOS (CONSULTAR, HISTORIAL, CANJEAR)
// Sistema de fidelización: los clientes acumulan puntos
// con cada compra ($10 = 1 punto) y pueden canjearlos
// por descuentos (10 puntos = $1 de descuento)
// =========================================================

// --- Consultar puntos actuales de un cliente ---
app.get("/puntos/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        // Retorna el saldo actual de puntos del cliente
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

// --- Historial de puntos ganados por compras ---
app.get("/puntos/:correo/historial", async (req, res) => {
    try {
        const correo = req.params.correo;

        // Retorna cada registro de puntos ganados con la venta asociada
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

// --- Canjear puntos por descuento ---
// Regla de negocio: 10 puntos = $1 de descuento
app.post("/puntos/canjear", async (req, res) => {
    try {
        const { correo_cliente, puntos_a_canjear } = req.body;

        if (!correo_cliente || !puntos_a_canjear || puntos_a_canjear <= 0) {
            return res.status(400).json({
                error: "Correo del cliente y cantidad de puntos son obligatorios."
            });
        }

        // Redondear hacia abajo para evitar fracciones de puntos
        const puntos = Math.floor(Number(puntos_a_canjear));

        // Verificar puntos disponibles del cliente
        const result = await db.query(
            "SELECT puntos FROM cliente WHERE correo_electronico = $1",
            [correo_cliente]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado." });
        }

        const puntosDisponibles = result.rows[0].puntos || 0;

        // No se pueden canjear más puntos de los que tiene
        if (puntos > puntosDisponibles) {
            return res.status(400).json({
                error: `El cliente solo tiene ${puntosDisponibles} puntos disponibles.`
            });
        }

        // Descontar puntos del saldo del cliente
        await db.query(
            "UPDATE cliente SET puntos = puntos - $1 WHERE correo_electronico = $2",
            [puntos, correo_cliente]
        );

        // Calcular descuento: 10 puntos = $1
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

// =========================================================
// SECCIÓN: PRÉSTAMOS DEL CLIENTE
// Consulta los préstamos de un cliente específico con
// estado calculado (Activo, Vencido, Devuelto, Por vencer)
// y días restantes para la devolución
// =========================================================

app.get("/prestamos/cliente/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        // Consulta con estado dinámico y días restantes:
        // - Devuelto: ya se entregó
        // - Vencido: pasó la fecha límite sin devolver
        // - Por vencer: falta 1 día o menos para vencer
        // - Activo: dentro del plazo normal
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

// =========================================================
// SECCIÓN: RECOMENDACIONES
// Sistema de recomendaciones personalizadas basado en:
// 1. Autores de libros favoritos del cliente
// 2. Autores de libros que ha comprado
// 3. Autores de libros que ha tomado en préstamo
// Si no hay suficientes, se completa con libros aleatorios
// =========================================================

// --- Recomendaciones personalizadas para un cliente logueado ---
app.get("/recomendaciones/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        // Obtener autores de los libros favoritos del cliente
        const favAutores = await db.query(
            `SELECT DISTINCT autor FROM libro_favorito WHERE correo_cliente = $1 AND autor IS NOT NULL`,
            [correo]
        );

        // Obtener autores de libros que ha comprado (a través del historial de puntos)
        const compraAutores = await db.query(
            `SELECT DISTINCT l.autor
             FROM venta v
             JOIN historial_puntos hp ON hp.id_venta = v.id_venta AND hp.correo_cliente = $1
             JOIN lib_venta lv ON lv.id_venta = v.id_venta
             JOIN libro l ON l.isbn = lv.isbn
             WHERE l.autor IS NOT NULL`,
            [correo]
        );

        // Obtener autores de libros que ha tomado en préstamo
        const presAutores = await db.query(
            `SELECT DISTINCT l.autor
             FROM prestamo p
             JOIN lib_pres lp ON lp.id_prestamo = p.id_prestamo
             JOIN libro l ON l.isbn = lp.isbn
             WHERE p.correo_cliente = $1 AND l.autor IS NOT NULL`,
            [correo]
        );

        // Combinar todos los autores en un Set para eliminar duplicados
        const autoresSet = new Set();
        [...favAutores.rows, ...compraAutores.rows, ...presAutores.rows].forEach(r => {
            if (r.autor) autoresSet.add(r.autor);
        });

        const autores = Array.from(autoresSet);

        let recomendaciones = [];

        if (autores.length > 0) {
            // Buscar libros de esos autores que el cliente NO tiene en favoritos
            // (para no recomendar lo que ya conoce)
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

        // Si no hay suficientes recomendaciones personalizadas, completar con libros populares
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

// --- Recomendaciones generales (sin login) ---
// Devuelve 12 libros aleatorios con precio > 0
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

// =========================================================
// SECCIÓN: DONACIONES
// Registro de donaciones de libros por parte de clientes.
// El cliente puede elegir entre dos recompensas:
// - "puntos": recibe 20 puntos por cada libro donado
// - "intercambio": recibe otro libro disponible a cambio
// Los libros donados se agregan al stock de venta y préstamo
// =========================================================

// --- Registrar una donación ---
app.post("/donaciones", async (req, res) => {
    try {
        const { correo_cliente, isbn, titulo, autor, cantidad, tipo_recompensa, isbn_intercambio } = req.body;

        // Validaciones de campos obligatorios
        if (!correo_cliente || !isbn || !titulo || !cantidad || cantidad < 1) {
            return res.status(400).json({
                error: "Correo del cliente, ISBN, título y cantidad son obligatorios."
            });
        }

        // Solo se aceptan dos tipos de recompensa
        if (!tipo_recompensa || !["puntos", "intercambio"].includes(tipo_recompensa)) {
            return res.status(400).json({
                error: "Debes elegir el tipo de recompensa: puntos o intercambio."
            });
        }

        // Verificar que el cliente existe en la base de datos
        const clienteExiste = await db.query(
            "SELECT correo_electronico FROM cliente WHERE correo_electronico = $1",
            [correo_cliente]
        );

        if (clienteExiste.rows.length === 0) {
            return res.status(404).json({ error: "El cliente no está registrado." });
        }

        const cantidadNum = Math.floor(Number(cantidad));

        // Si es intercambio, verificar que el libro solicitado tenga stock disponible
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
            // Regla de negocio: 20 puntos por cada libro donado
            puntosOtorgados = cantidadNum * 20;

            // Sumar puntos al saldo del cliente
            await db.query(
                "UPDATE cliente SET puntos = puntos + $1 WHERE correo_electronico = $2",
                [puntosOtorgados, correo_cliente]
            );
        } else {
            // Intercambio: descontar 1 unidad del libro que el cliente quiere recibir
            await db.query(
                "UPDATE lib_venta SET cantidad = cantidad - 1 WHERE isbn = $1 AND id_venta IS NULL",
                [isbn_intercambio]
            );
        }

        // Registrar la donación en la tabla de donaciones
        await db.query(
            `INSERT INTO donacion (correo_cliente, isbn, titulo, autor, cantidad, puntos_otorgados)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [correo_cliente, isbn, titulo, autor || null, cantidadNum, puntosOtorgados]
        );

        // Si el libro donado no existe en la base, crearlo con precio 0
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

        // Agregar las unidades donadas al stock de venta
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

        // Agregar las unidades donadas al stock de préstamo
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

// --- Consultar libros disponibles para intercambio ---
// Muestra libros que han sido donados previamente y tienen stock
app.get("/donaciones/libros-disponibles", async (req, res) => {
    try {
        // Muestra libros donados que aún tienen stock disponible para intercambio
        const result = await db.query(`
            SELECT d.isbn, d.titulo, d.autor
            FROM donacion d
            JOIN lib_venta lv ON lv.isbn = d.isbn AND lv.id_venta IS NULL AND lv.cantidad > 0
            GROUP BY d.isbn, d.titulo, d.autor
            ORDER BY d.titulo
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al consultar libros disponibles:", error);
        res.status(500).json({ error: "Error al consultar libros disponibles." });
    }
});

// --- Consultar donaciones de un cliente específico ---
app.get("/donaciones/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        // Retorna historial de donaciones del cliente ordenado por fecha
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

// =========================================================
// SECCIÓN: FAVORITOS
// Gestión de la lista de libros favoritos de cada cliente.
// Permite consultar, agregar y eliminar libros de la lista.
// Se usa ON CONFLICT para evitar duplicados al agregar.
// =========================================================

// --- Consultar favoritos de un cliente ---
app.get("/favoritos/:correo", async (req, res) => {
    try {
        const correo = req.params.correo;

        // Retorna la lista de favoritos ordenada por fecha (más recientes primero)
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

// --- Agregar libro a favoritos ---
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

        // ON CONFLICT DO NOTHING evita error si el libro ya está en favoritos
        // (la clave única es correo_cliente + isbn)
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

// --- Eliminar libro de favoritos ---
app.delete("/favoritos/:correo/:isbn", async (req, res) => {
    try {
        const { correo, isbn } = req.params;

        // Eliminar la relación favorito por correo + isbn
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

// =========================================================
// SECCIÓN: SERVIDOR
// Inicialización del servidor Express en el puerto
// configurado en las variables de entorno (o 3000 por defecto)
// =========================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
