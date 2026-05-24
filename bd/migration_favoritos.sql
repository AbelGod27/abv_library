-- Migración: Tabla de libros favoritos para clientes
-- Ejecutar en la base de datos abv_library

CREATE TABLE IF NOT EXISTS libro_favorito (
    id_favorito     SERIAL PRIMARY KEY,
    correo_cliente  VARCHAR(100) NOT NULL,
    isbn            VARCHAR(20) NOT NULL,
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
