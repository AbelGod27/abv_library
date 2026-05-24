-- Migración: Sistema de puntos por compras
-- Ejecutar en la base de datos abv_library

-- Agregar columna de puntos al cliente
ALTER TABLE cliente
ADD COLUMN IF NOT EXISTS puntos INTEGER DEFAULT 0;

-- Historial de puntos ganados
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
