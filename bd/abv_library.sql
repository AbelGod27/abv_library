-- =============================================
-- ABV LIBRARY — Esquema completo de la base de datos
-- Ejecutar en PostgreSQL para crear todas las tablas
-- =============================================

-- PERSONA (tabla base para empleados y clientes)
CREATE TABLE IF NOT EXISTS persona (
    correo_electronico  VARCHAR(100) PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL,
    ap_paterno          VARCHAR(100) NOT NULL,
    ap_materno          VARCHAR(100),
    fecha_de_nacimiento DATE NOT NULL,
    telefono            VARCHAR(15),
    contrasena_hash     VARCHAR(255)
);

-- EMPLEADO
CREATE TABLE IF NOT EXISTS empleado (
    correo_electronico  VARCHAR(100) PRIMARY KEY,
    rol                 VARCHAR(50) NOT NULL,
    CONSTRAINT fk_empleado_persona
        FOREIGN KEY (correo_electronico)
        REFERENCES persona(correo_electronico)
        ON DELETE CASCADE
);

-- CLIENTE
CREATE TABLE IF NOT EXISTS cliente (
    correo_electronico  VARCHAR(100) PRIMARY KEY,
    fecha_de_registro   DATE DEFAULT CURRENT_DATE,
    puntos              INTEGER DEFAULT 0,
    CONSTRAINT fk_cliente_persona
        FOREIGN KEY (correo_electronico)
        REFERENCES persona(correo_electronico)
        ON DELETE CASCADE
);

-- PROVEEDOR
CREATE TABLE IF NOT EXISTS proveedor (
    id_proveedor    SERIAL PRIMARY KEY,
    nombre          VARCHAR(200) NOT NULL
);

-- LIBRO
CREATE TABLE IF NOT EXISTS libro (
    isbn                VARCHAR(50) PRIMARY KEY,
    titulo              VARCHAR(255) NOT NULL,
    autor               VARCHAR(255) NOT NULL,
    editorial           VARCHAR(255),
    version             VARCHAR(100),
    anio_publicacion    DATE,
    precio              NUMERIC(10,2) DEFAULT 0
);

-- VENTA
CREATE TABLE IF NOT EXISTS venta (
    id_venta            SERIAL PRIMARY KEY,
    fecha               DATE NOT NULL,
    hora                TIME NOT NULL,
    total_pagado        NUMERIC(10,2) NOT NULL,
    metodo_de_pago      VARCHAR(50) NOT NULL,
    correo_electronico  VARCHAR(100) NOT NULL,
    CONSTRAINT fk_venta_empleado
        FOREIGN KEY (correo_electronico)
        REFERENCES empleado(correo_electronico)
);

-- LIB_VENTA (stock para venta y libros vendidos)
CREATE TABLE IF NOT EXISTS lib_venta (
    id_lib_venta    SERIAL PRIMARY KEY,
    cantidad        INTEGER NOT NULL,
    id_venta        INTEGER,
    isbn            VARCHAR(50) NOT NULL,
    CONSTRAINT fk_libventa_venta
        FOREIGN KEY (id_venta)
        REFERENCES venta(id_venta),
    CONSTRAINT fk_libventa_libro
        FOREIGN KEY (isbn)
        REFERENCES libro(isbn)
);

-- PRESTAMO
CREATE TABLE IF NOT EXISTS prestamo (
    id_prestamo         SERIAL PRIMARY KEY,
    multa               NUMERIC(10,2) DEFAULT 0,
    dia_de_inicio       DATE NOT NULL,
    dia_de_vencimiento  DATE NOT NULL,
    dia_de_entrega      DATE,
    cantidad_de_libros  INTEGER NOT NULL,
    correo_cliente      VARCHAR(100) NOT NULL,
    correo_empleado     VARCHAR(100) NOT NULL,
    CONSTRAINT fk_prestamo_cliente
        FOREIGN KEY (correo_cliente)
        REFERENCES cliente(correo_electronico),
    CONSTRAINT fk_prestamo_empleado
        FOREIGN KEY (correo_empleado)
        REFERENCES empleado(correo_electronico)
);

-- LIB_PRES (stock para prestamo y libros prestados)
CREATE TABLE IF NOT EXISTS lib_pres (
    id_lib_pres     SERIAL PRIMARY KEY,
    cantidad        INTEGER NOT NULL,
    id_prestamo     INTEGER,
    isbn            VARCHAR(50) NOT NULL,
    CONSTRAINT fk_libpres_prestamo
        FOREIGN KEY (id_prestamo)
        REFERENCES prestamo(id_prestamo),
    CONSTRAINT fk_libpres_libro
        FOREIGN KEY (isbn)
        REFERENCES libro(isbn)
);

-- LIBRO FAVORITO
CREATE TABLE IF NOT EXISTS libro_favorito (
    id_favorito     SERIAL PRIMARY KEY,
    correo_cliente  VARCHAR(100) NOT NULL,
    isbn            VARCHAR(50) NOT NULL,
    titulo          VARCHAR(255) NOT NULL,
    autor           VARCHAR(255),
    fecha_agregado  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorito_cliente
        FOREIGN KEY (correo_cliente)
        REFERENCES cliente(correo_electronico)
        ON DELETE CASCADE,
    CONSTRAINT uq_favorito_cliente_isbn
        UNIQUE (correo_cliente, isbn)
);

-- HISTORIAL DE PUNTOS
CREATE TABLE IF NOT EXISTS historial_puntos (
    id_historial    SERIAL PRIMARY KEY,
    correo_cliente  VARCHAR(100) NOT NULL,
    id_venta        INTEGER NOT NULL,
    puntos_ganados  INTEGER NOT NULL,
    fecha           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_puntos_cliente
        FOREIGN KEY (correo_cliente)
        REFERENCES cliente(correo_electronico)
        ON DELETE CASCADE,
    CONSTRAINT fk_puntos_venta
        FOREIGN KEY (id_venta)
        REFERENCES venta(id_venta)
        ON DELETE CASCADE
);

-- DONACION
CREATE TABLE IF NOT EXISTS donacion (
    id_donacion         SERIAL PRIMARY KEY,
    correo_cliente      VARCHAR(100) NOT NULL,
    isbn                VARCHAR(50) NOT NULL,
    titulo              VARCHAR(255) NOT NULL,
    autor               VARCHAR(255),
    cantidad            INTEGER NOT NULL DEFAULT 1,
    puntos_otorgados    INTEGER NOT NULL DEFAULT 0,
    fecha               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_donacion_cliente
        FOREIGN KEY (correo_cliente)
        REFERENCES cliente(correo_electronico)
        ON DELETE CASCADE
);
