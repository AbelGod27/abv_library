-- Migración: Tabla de donaciones de libros por clientes
-- Ejecutar en la base de datos abv_library

CREATE TABLE IF NOT EXISTS donacion (
    id_donacion         SERIAL PRIMARY KEY,
    correo_cliente      VARCHAR(100) NOT NULL,
    isbn                VARCHAR(20) NOT NULL,
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
