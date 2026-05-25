-- Libros adicionales: ciencia ficción, terror, novela negra, mexicanos, contemporáneos

INSERT INTO libro (isbn, titulo, autor, editorial, version, anio_publicacion, precio) VALUES
-- Ciencia ficción moderna
('978-0553380163', 'Dune', 'Frank Herbert', 'Ace Books', '1ra edición', '1965-08-01', 299.00),
('978-0345391803', 'El juego de Ender', 'Orson Scott Card', 'Tor Books', '1ra edición', '1985-01-15', 249.00),
('978-0441569595', 'Neuromante', 'William Gibson', 'Ace Books', '1ra edición', '1984-07-01', 229.00),
('978-0345404473', 'Fahrenheit 451 (edición especial)', 'Ray Bradbury', 'Del Rey', 'Edición 50 aniversario', '2003-01-01', 219.00),
('978-0345342966', 'Guía del autoestopista galáctico', 'Douglas Adams', 'Del Rey', '1ra edición', '1979-10-12', 199.00),
('978-0765326355', 'El nombre del viento', 'Patrick Rothfuss', 'DAW Books', '1ra edición', '2007-03-27', 329.00),
('978-0765311788', 'Mistborn: El imperio final', 'Brandon Sanderson', 'Tor Books', '1ra edición', '2006-07-17', 309.00),
('978-0553573404', 'Juego de tronos', 'George R.R. Martin', 'Bantam', '1ra edición', '1996-08-01', 349.00),

-- Terror y horror
('978-0451169525', 'Salem''s Lot', 'Stephen King', 'Doubleday', '1ra edición', '1975-10-17', 249.00),
('978-0345806789', 'Doctor Sueño', 'Stephen King', 'Scribner', '1ra edición', '2013-09-24', 299.00),
('978-0812505146', 'La llamada de Cthulhu', 'H.P. Lovecraft', 'Del Rey', '1ra edición', '1928-01-01', 179.00),
('978-0345476876', 'Entrevista con el vampiro', 'Anne Rice', 'Ballantine', '1ra edición', '1976-05-05', 229.00),
('978-0062024039', 'La maldición de Hill House', 'Shirley Jackson', 'Penguin', '1ra edición', '1959-01-01', 199.00),

-- Novela negra y thriller
('978-0307454546', 'Los hombres que no amaban a las mujeres', 'Stieg Larsson', 'Vintage', '1ra edición', '2005-08-01', 279.00),
('978-0307949509', 'El laberinto de los espíritus', 'Carlos Ruiz Zafón', 'Vintage', '1ra edición', '2016-11-17', 319.00),
('978-0316769174', 'El silencio de los corderos', 'Thomas Harris', 'St. Martin''s', '1ra edición', '1988-05-01', 249.00),
('978-0307277671', 'En la sangre', 'Truman Capote', 'Vintage', '1ra edición', '1966-01-17', 219.00),

-- Literatura mexicana contemporánea
('978-6073139205', 'El complot mongol', 'Rafael Bernal', 'Planeta México', '1ra edición', '1969-01-01', 189.00),
('978-6070734625', 'Temporada de huracanes', 'Fernanda Melchor', 'Random House', '1ra edición', '2017-01-01', 259.00),
('978-6073172042', 'Las batallas en el desierto', 'José Emilio Pacheco', 'Era', '1ra edición', '1981-01-01', 149.00),
('978-6071411839', 'Aura', 'Carlos Fuentes', 'Era', '1ra edición', '1962-01-01', 129.00),
('978-6070747168', 'La región más transparente', 'Carlos Fuentes', 'Alfaguara', '1ra edición', '1958-01-01', 269.00),
('978-6073801652', 'Paradais', 'Fernanda Melchor', 'Random House', '1ra edición', '2021-01-01', 249.00),

-- Autores contemporáneos populares
('978-0735219090', 'Donde cantan los cangrejos', 'Delia Owens', 'Putnam', '1ra edición', '2018-08-14', 289.00),
('978-1501110368', 'Pequeñas cosas bellas', 'Cheryl Strayed', 'Vintage', '1ra edición', '2012-03-20', 219.00),
('978-0525559481', 'La biblioteca de la medianoche', 'Matt Haig', 'Viking', '1ra edición', '2020-08-13', 279.00),
('978-0593321201', 'Malibu Rising', 'Taylor Jenkins Reid', 'Ballantine', '1ra edición', '2021-06-01', 269.00),
('978-1501161933', 'It Ends with Us', 'Colleen Hoover', 'Atria', '1ra edición', '2016-08-02', 239.00),
('978-0593230251', 'La canción de Aquiles', 'Madeline Miller', 'Ecco', '1ra edición', '2011-09-20', 259.00),
('978-0316556347', 'Circe', 'Madeline Miller', 'Little Brown', '1ra edición', '2018-04-10', 279.00),

-- Filosofía y ensayo
('978-0679733782', 'El arte de la guerra', 'Sun Tzu', 'Vintage', 'Edición clásica', '2000-01-01', 149.00),
('978-0140449334', 'Meditaciones', 'Marco Aurelio', 'Penguin Classics', '1ra edición', '2006-01-01', 169.00),
('978-0062457738', 'Un nuevo mundo ahora', 'Eckhart Tolle', 'Penguin', '1ra edición', '2005-01-01', 219.00),
('978-0062316103', 'Hábitos atómicos', 'James Clear', 'Avery', '1ra edición', '2018-10-16', 299.00),

-- Poesía
('978-0811215572', 'Antología poética', 'Federico García Lorca', 'New Directions', '1ra edición', '2005-01-01', 179.00),
('978-0374529024', 'Poesía completa', 'Alejandra Pizarnik', 'Lumen', '1ra edición', '2000-01-01', 229.00),
('978-0811223485', 'Piedra de sol', 'Octavio Paz', 'New Directions', '1ra edición', '1957-01-01', 159.00),

-- Clásicos que faltaban
('978-0140449136', 'Los viajes de Gulliver', 'Jonathan Swift', 'Penguin Classics', '1ra edición', '1726-10-28', 159.00),
('978-0141439662', 'Robinson Crusoe', 'Daniel Defoe', 'Penguin Classics', '1ra edición', '1719-04-25', 149.00),
('978-0140620085', 'El principito', 'Antoine de Saint-Exupéry', 'Penguin', '1ra edición', '1943-04-06', 139.00)
ON CONFLICT (isbn) DO NOTHING;
