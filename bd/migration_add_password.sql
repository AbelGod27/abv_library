-- =============================================
-- MIGRACIÓN: Agregar campo contrasena_hash a persona
-- Ejecutar una sola vez en PostgreSQL
-- =============================================

-- 1. Agregar la columna (nullable al inicio para no romper registros existentes)
ALTER TABLE persona
ADD COLUMN IF NOT EXISTS contrasena_hash TEXT;

-- 2. (Opcional) Asignar una contraseña temporal a empleados existentes.
--    El hash corresponde a la contraseña "Cambiar123!" generada con bcrypt (10 rounds).
--    Después de migrar, cada usuario debe cambiar su contraseña.
--
--    Para generar un hash propio desde Node.js:
--      const bcrypt = require('bcrypt');
--      bcrypt.hash('Cambiar123!', 10).then(console.log);
--
-- UPDATE persona
-- SET contrasena_hash = '$2b$10$REEMPLAZA_CON_TU_HASH_REAL'
-- WHERE contrasena_hash IS NULL;

-- 3. Una vez que todos los usuarios tengan contraseña, puedes hacer la columna NOT NULL:
-- ALTER TABLE persona ALTER COLUMN contrasena_hash SET NOT NULL;
