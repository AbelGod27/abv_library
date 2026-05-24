-- Migración: Agregar precio a la tabla libro
-- Ejecutar en la base de datos abv_library

ALTER TABLE libro
ADD COLUMN IF NOT EXISTS precio NUMERIC(10,2) DEFAULT 0;
