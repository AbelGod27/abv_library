-- =============================================
-- SEED: 150 libros reales con ISBN, version y precio
-- Ejecutar: psql -d tu_bd -f bd/seed_libros.sql
-- =============================================

-- Garcia Marquez, Borges, Allende, Cortazar, Vargas Llosa, Rulfo, Bolaño
INSERT INTO libro (isbn, titulo, autor, editorial, version, anio_publicacion, precio) VALUES
('978-0060883287', 'Cien años de soledad', 'Gabriel García Márquez', 'Harper', '1ra edición', '1967-06-05', 289.00),
('978-0140283297', 'El amor en los tiempos del cólera', 'Gabriel García Márquez', 'Penguin', '1ra edición', '1985-01-01', 259.00),
('978-0060114183', 'Crónica de una muerte anunciada', 'Gabriel García Márquez', 'Vintage', '1ra edición', '1981-01-01', 199.00),
('978-0060114879', 'El otoño del patriarca', 'Gabriel García Márquez', 'Harper', '1ra edición', '1975-01-01', 239.00),
('978-0060932145', 'El general en su laberinto', 'Gabriel García Márquez', 'Vintage', '1ra edición', '1989-01-01', 229.00),
('978-1400034925', 'Vivir para contarla', 'Gabriel García Márquez', 'Vintage', '1ra edición', '2002-01-01', 269.00),
('978-0060153137', 'El coronel no tiene quien le escriba', 'Gabriel García Márquez', 'Harper', '1ra edición', '1961-01-01', 179.00),
('978-0307389732', 'Memoria de mis putas tristes', 'Gabriel García Márquez', 'Vintage', '1ra edición', '2004-01-01', 199.00),
('978-0802130204', 'Ficciones', 'Jorge Luis Borges', 'Grove Press', '1ra edición', '1944-01-01', 245.00),
('978-0142437230', 'El Aleph', 'Jorge Luis Borges', 'Penguin', '1ra edición', '1949-01-01', 219.00),
('978-0060951849', 'La casa de los espíritus', 'Isabel Allende', 'Harper', '1ra edición', '1982-01-01', 279.00),
('978-0061120084', 'De amor y de sombra', 'Isabel Allende', 'HarperCollins', '1ra edición', '1984-01-01', 239.00),
('978-0374529604', 'Rayuela', 'Julio Cortázar', 'Pantheon', '1ra edición', '1963-01-01', 299.00),
('978-0811216982', 'Bestiario', 'Julio Cortázar', 'New Directions', '1ra edición', '1951-01-01', 189.00),
('978-0374530280', 'La ciudad y los perros', 'Mario Vargas Llosa', 'FSG', '1ra edición', '1963-01-01', 269.00),
('978-0060732806', 'La fiesta del chivo', 'Mario Vargas Llosa', 'Harper', '1ra edición', '2000-01-01', 289.00),
('978-0802133908', 'Pedro Páramo', 'Juan Rulfo', 'Grove Press', '1ra edición', '1955-01-01', 179.00),
('978-0811213684', 'El llano en llamas', 'Juan Rulfo', 'Grove Press', '1ra edición', '1953-01-01', 169.00),
('978-0374100148', '2666', 'Roberto Bolaño', 'FSG', '1ra edición', '2004-01-01', 349.00),
('978-0312420239', 'Los detectives salvajes', 'Roberto Bolaño', 'Picador', '1ra edición', '1998-01-01', 319.00),

-- Kafka
('978-0805209990', 'La metamorfosis', 'Franz Kafka', 'Schocken', '1ra edición', '1915-01-01', 149.00),
('978-0805210408', 'El proceso', 'Franz Kafka', 'Schocken', '1ra edición', '1925-01-01', 189.00),
('978-0805211061', 'El castillo', 'Franz Kafka', 'Schocken', '1ra edición', '1926-01-01', 199.00),
('978-0805208535', 'Carta al padre', 'Franz Kafka', 'Schocken', '1ra edición', '1919-01-01', 129.00),
('978-0805210576', 'América', 'Franz Kafka', 'Schocken', '1ra edición', '1927-01-01', 179.00),

-- Camus
('978-0553213683', 'El extranjero', 'Albert Camus', 'Vintage', '1ra edición', '1942-01-01', 159.00),
('978-0679720201', 'La peste', 'Albert Camus', 'Vintage', '1ra edición', '1947-01-01', 179.00),
('978-0679733737', 'La caída', 'Albert Camus', 'Vintage', '1ra edición', '1956-01-01', 159.00),
('978-0679720225', 'El mito de Sísifo', 'Albert Camus', 'Vintage', '1ra edición', '1942-01-01', 169.00),
('978-0679733973', 'El primer hombre', 'Albert Camus', 'Vintage', '1ra edición', '1994-01-01', 189.00),

-- Dostoevsky
('978-0142437179', 'Crimen y castigo', 'Fyodor Dostoevsky', 'Penguin Classics', '1ra edición', '1866-01-01', 189.00),
('978-0374528379', 'Los hermanos Karamázov', 'Fyodor Dostoevsky', 'FSG', '1ra edición', '1880-01-01', 219.00),
('978-0140449136', 'El idiota', 'Fyodor Dostoevsky', 'Penguin Classics', '1ra edición', '1869-01-01', 209.00),
('978-0140449228', 'Demonios', 'Fyodor Dostoevsky', 'Penguin Classics', '1ra edición', '1872-01-01', 219.00),
('978-0140449174', 'Noches blancas', 'Fyodor Dostoevsky', 'Penguin Classics', '1ra edición', '1848-01-01', 139.00),

-- Tolstoy
('978-0143035008', 'Anna Karénina', 'Leo Tolstoy', 'Penguin Classics', '1ra edición', '1878-01-01', 199.00),
('978-0143039990', 'Guerra y paz', 'Leo Tolstoy', 'Penguin Classics', '1ra edición', '1869-01-01', 249.00),

-- Orwell, Huxley, Bradbury, Asimov
('978-0451524935', '1984', 'George Orwell', 'Signet Classic', '1ra edición', '1949-06-08', 159.00),
('978-0451526342', 'Rebelión en la granja', 'George Orwell', 'Signet Classic', '1ra edición', '1945-08-17', 139.00),
('978-0060935467', 'Un mundo feliz', 'Aldous Huxley', 'Harper', '1ra edición', '1932-01-01', 169.00),
('978-1451673319', 'Fahrenheit 451', 'Ray Bradbury', 'Simon & Schuster', '60th Anniversary', '1953-10-19', 199.00),
('978-0553293357', 'Fundación', 'Isaac Asimov', 'Bantam', '1ra edición', '1951-01-01', 189.00),
('978-0553803716', 'Yo, Robot', 'Isaac Asimov', 'Bantam', '1ra edición', '1950-01-01', 179.00),

-- Tolkien, Rowling
('978-0547928227', 'El Hobbit', 'J.R.R. Tolkien', 'Houghton Mifflin', '75th Anniversary', '1937-09-21', 299.00),
('978-0544003415', 'El Señor de los Anillos', 'J.R.R. Tolkien', 'Houghton Mifflin', 'Edición completa', '1954-07-29', 549.00),
('978-0439708180', 'Harry Potter y la piedra filosofal', 'J.K. Rowling', 'Scholastic', '1ra edición', '1997-06-26', 259.00),
('978-0439064866', 'Harry Potter y la cámara secreta', 'J.K. Rowling', 'Scholastic', '1ra edición', '1998-07-02', 259.00),
('978-0439136358', 'Harry Potter y el prisionero de Azkaban', 'J.K. Rowling', 'Scholastic', '1ra edición', '1999-07-08', 279.00),
('978-0439139601', 'Harry Potter y el cáliz de fuego', 'J.K. Rowling', 'Scholastic', '1ra edición', '2000-07-08', 299.00),

-- King, Dan Brown, Coelho, Murakami
('978-0385333481', 'El resplandor', 'Stephen King', 'Doubleday', '1ra edición', '1977-01-28', 269.00),
('978-1501142970', 'It', 'Stephen King', 'Scribner', '1ra edición', '1986-09-15', 349.00),
('978-1501175466', 'El instituto', 'Stephen King', 'Scribner', '1ra edición', '2019-09-10', 319.00),
('978-0307474278', 'El código Da Vinci', 'Dan Brown', 'Anchor', '1ra edición', '2003-03-18', 229.00),
('978-1400079148', 'Ángeles y demonios', 'Dan Brown', 'Pocket Books', '1ra edición', '2000-05-01', 219.00),
('978-0062073488', 'Inferno', 'Dan Brown', 'Anchor', '1ra edición', '2013-05-14', 239.00),
('978-0062315007', 'El alquimista', 'Paulo Coelho', 'HarperOne', '25th Anniversary', '1988-01-01', 199.00),
('978-0061122415', 'El Zahir', 'Paulo Coelho', 'HarperCollins', '1ra edición', '2005-01-01', 219.00),
('978-0307476463', 'Kafka en la orilla', 'Haruki Murakami', 'Vintage', '1ra edición', '2002-01-01', 279.00),
('978-0375718946', 'Tokio blues', 'Haruki Murakami', 'Vintage', '1ra edición', '1987-01-01', 249.00),
('978-0307593313', '1Q84', 'Haruki Murakami', 'Vintage', 'Edición completa', '2009-01-01', 399.00),

-- Harari, no ficcion
('978-0062316097', 'Sapiens', 'Yuval Noah Harari', 'Harper', '1ra edición', '2011-01-01', 349.00),
('978-0062464316', 'Homo Deus', 'Yuval Noah Harari', 'Harper', '1ra edición', '2015-09-04', 329.00),
('978-0525512172', '21 lecciones para el siglo XXI', 'Yuval Noah Harari', 'Spiegel & Grau', '1ra edición', '2018-08-30', 319.00),
('978-0062457714', 'El poder del ahora', 'Eckhart Tolle', 'New World Library', '1ra edición', '1997-01-01', 229.00),
('978-0807014295', 'El hombre en busca de sentido', 'Viktor Frankl', 'Beacon Press', '1ra edición', '1946-01-01', 189.00),
('978-0743269513', 'Pensar rápido, pensar despacio', 'Daniel Kahneman', 'FSG', '1ra edición', '2011-10-25', 329.00),

-- Hermann Hesse
('978-0553208849', 'Siddhartha', 'Hermann Hesse', 'Bantam', '1ra edición', '1922-01-01', 159.00),
('978-0312278496', 'El lobo estepario', 'Hermann Hesse', 'Picador', '1ra edición', '1927-01-01', 179.00),
('978-0060911027', 'Demian', 'Hermann Hesse', 'Harper', '1ra edición', '1919-01-01', 159.00),
('978-0553263718', 'Narciso y Goldmundo', 'Hermann Hesse', 'Bantam', '1ra edición', '1930-01-01', 169.00),

-- Virginia Woolf
('978-0156030359', 'La señora Dalloway', 'Virginia Woolf', 'Harcourt', '1ra edición', '1925-01-01', 169.00),
('978-0156907392', 'Al faro', 'Virginia Woolf', 'Harcourt', '1ra edición', '1927-01-01', 179.00),
('978-0156031776', 'Orlando', 'Virginia Woolf', 'Harcourt', '1ra edición', '1928-01-01', 169.00),
('978-0156949606', 'Una habitación propia', 'Virginia Woolf', 'Harcourt', '1ra edición', '1929-01-01', 149.00),

-- James Joyce
('978-0679722762', 'Ulises', 'James Joyce', 'Vintage', 'Edición completa', '1922-02-02', 349.00),
('978-0140186475', 'Dublineses', 'James Joyce', 'Penguin', '1ra edición', '1914-01-01', 159.00),
('978-0142437346', 'Retrato del artista adolescente', 'James Joyce', 'Penguin', '1ra edición', '1916-01-01', 149.00),

-- Sartre, Beauvoir
('978-0811220309', 'La náusea', 'Jean-Paul Sartre', 'New Directions', '1ra edición', '1938-01-01', 169.00),
('978-0679736523', 'El ser y la nada', 'Jean-Paul Sartre', 'Washington Square', '1ra edición', '1943-01-01', 249.00),
('978-0679725169', 'A puerta cerrada', 'Jean-Paul Sartre', 'Vintage', '1ra edición', '1944-01-01', 139.00),
('978-0307277787', 'El segundo sexo', 'Simone de Beauvoir', 'Vintage', 'Edición completa', '1949-01-01', 279.00),

-- Nietzsche
('978-0140441185', 'Así habló Zaratustra', 'Friedrich Nietzsche', 'Penguin', '1ra edición', '1883-01-01', 179.00),
('978-0679724629', 'Más allá del bien y del mal', 'Friedrich Nietzsche', 'Vintage', '1ra edición', '1886-01-01', 169.00),
('978-0486298689', 'El nacimiento de la tragedia', 'Friedrich Nietzsche', 'Dover', '1ra edición', '1872-01-01', 129.00),

-- Kundera, Calvino, Saramago
('978-0060932138', 'La insoportable levedad del ser', 'Milan Kundera', 'Harper', '1ra edición', '1984-01-01', 219.00),
('978-0060997007', 'La broma', 'Milan Kundera', 'Harper', '1ra edición', '1967-01-01', 189.00),
('978-0156453806', 'Si una noche de invierno un viajero', 'Italo Calvino', 'Harcourt', '1ra edición', '1979-01-01', 199.00),
('978-0156046527', 'Las ciudades invisibles', 'Italo Calvino', 'Harcourt', '1ra edición', '1972-01-01', 179.00),
('978-0156028004', 'El barón rampante', 'Italo Calvino', 'Harcourt', '1ra edición', '1957-01-01', 169.00),
('978-0156007757', 'Ensayo sobre la ceguera', 'José Saramago', 'Harcourt', '1ra edición', '1995-01-01', 229.00),
('978-0151004218', 'El evangelio según Jesucristo', 'José Saramago', 'Harcourt', '1ra edición', '1991-01-01', 219.00),
('978-0156005616', 'Todos los nombres', 'José Saramago', 'Harcourt', '1ra edición', '1997-01-01', 209.00),

-- Clasicos: Austen, Dickens, Cervantes, Hugo, Dumas, Wilde, Bronte, Hemingway, Twain
('978-0141439518', 'Orgullo y prejuicio', 'Jane Austen', 'Penguin Classics', '1ra edición', '1813-01-28', 149.00),
('978-0141439587', 'Emma', 'Jane Austen', 'Penguin Classics', '1ra edición', '1815-12-23', 149.00),
('978-0141439600', 'Grandes esperanzas', 'Charles Dickens', 'Penguin Classics', '1ra edición', '1861-01-01', 159.00),
('978-0141439563', 'Oliver Twist', 'Charles Dickens', 'Penguin Classics', '1ra edición', '1837-01-01', 149.00),
('978-0141439648', 'Historia de dos ciudades', 'Charles Dickens', 'Penguin Classics', '1ra edición', '1859-01-01', 159.00),
('978-0060934347', 'Don Quijote de la Mancha', 'Miguel de Cervantes', 'Harper', 'Edición completa', '1605-01-16', 329.00),
('978-0140449266', 'La Divina Comedia', 'Dante Alighieri', 'Penguin Classics', '1ra edición', '1320-01-01', 199.00),
('978-0451419439', 'Los miserables', 'Victor Hugo', 'Signet Classics', 'Edición completa', '1862-01-01', 279.00),
('978-0140449020', 'El conde de Montecristo', 'Alexandre Dumas', 'Penguin Classics', 'Edición completa', '1844-01-01', 269.00),
('978-0141439471', 'Drácula', 'Bram Stoker', 'Penguin Classics', '1ra edición', '1897-05-26', 169.00),
('978-0141439839', 'Frankenstein', 'Mary Shelley', 'Penguin Classics', '1ra edición', '1818-01-01', 149.00),
('978-0486284729', 'El retrato de Dorian Gray', 'Oscar Wilde', 'Dover', '1ra edición', '1890-07-01', 129.00),
('978-0486277875', 'La importancia de llamarse Ernesto', 'Oscar Wilde', 'Dover', '1ra edición', '1895-01-01', 99.00),
('978-0141439747', 'Jane Eyre', 'Charlotte Brontë', 'Penguin Classics', '1ra edición', '1847-10-16', 159.00),
('978-0060850524', 'El viejo y el mar', 'Ernest Hemingway', 'Scribner', '1ra edición', '1952-09-01', 169.00),
('978-0684801223', 'Por quién doblan las campanas', 'Ernest Hemingway', 'Scribner', '1ra edición', '1940-10-21', 199.00),
('978-0684830490', 'Adiós a las armas', 'Ernest Hemingway', 'Scribner', '1ra edición', '1929-09-27', 189.00),
('978-0743273565', 'El gran Gatsby', 'F. Scott Fitzgerald', 'Scribner', '1ra edición', '1925-04-10', 179.00),
('978-0316769488', 'El guardián entre el centeno', 'J.D. Salinger', 'Back Bay Books', '2da edición', '1951-07-16', 189.00),

-- Contemporaneos y thriller
('978-0307949486', 'La sombra del viento', 'Carlos Ruiz Zafón', 'Vintage', '1ra edición', '2001-01-01', 289.00),
('978-0307949493', 'El juego del ángel', 'Carlos Ruiz Zafón', 'Vintage', '1ra edición', '2008-01-01', 279.00),
('978-0060732936', 'El capitán Alatriste', 'Arturo Pérez-Reverte', 'Putnam', '1ra edición', '1996-01-01', 229.00),
('978-0060929879', 'El nombre de la rosa', 'Umberto Eco', 'Harcourt', '1ra edición', '1980-01-01', 289.00),
('978-0156030410', 'El péndulo de Foucault', 'Umberto Eco', 'Harcourt', '1ra edición', '1988-01-01', 269.00),
('978-0525559474', 'La chica del tren', 'Paula Hawkins', 'Riverhead', '1ra edición', '2015-01-13', 249.00),
('978-0307588364', 'Perdida', 'Gillian Flynn', 'Crown', '1ra edición', '2012-06-05', 259.00),
('978-0439023481', 'Los juegos del hambre', 'Suzanne Collins', 'Scholastic', '1ra edición', '2008-09-14', 249.00),
('978-0525478812', 'Bajo la misma estrella', 'John Green', 'Dutton', '1ra edición', '2012-01-10', 219.00),

-- Latinoamericanos adicionales
('978-0060512804', 'Veinte poemas de amor', 'Pablo Neruda', 'Penguin', '1ra edición', '1924-01-01', 149.00),
('978-0060882860', 'Como agua para chocolate', 'Laura Esquivel', 'Anchor', '1ra edición', '1989-01-01', 199.00),
('978-0060006006', 'La tregua', 'Mario Benedetti', 'Harper', '1ra edición', '1960-01-01', 169.00),
('978-1568495835', 'Las venas abiertas de América Latina', 'Eduardo Galeano', 'Monthly Review', '1ra edición', '1971-01-01', 219.00),
('978-0060530457', 'El túnel', 'Ernesto Sabato', 'Harper', '1ra edición', '1948-01-01', 159.00),
('978-0375724442', 'La invención de Morel', 'Adolfo Bioy Casares', 'NYRB', '1ra edición', '1940-01-01', 179.00),
('978-0062316110', 'Los cuatro acuerdos', 'Miguel Ruiz', 'Amber-Allen', '1ra edición', '1997-01-01', 179.00)
ON CONFLICT (isbn) DO NOTHING;


-- =============================================
-- Libros adicionales: ciencia ficción, terror, novela negra, mexicanos, contemporáneos
-- =============================================

INSERT INTO libro (isbn, titulo, autor, editorial, version, anio_publicacion, precio) VALUES
('978-0553380163', 'Dune', 'Frank Herbert', 'Ace Books', '1ra edición', '1965-08-01', 299.00),
('978-0345391803', 'El juego de Ender', 'Orson Scott Card', 'Tor Books', '1ra edición', '1985-01-15', 249.00),
('978-0441569595', 'Neuromante', 'William Gibson', 'Ace Books', '1ra edición', '1984-07-01', 229.00),
('978-0345404473', 'Fahrenheit 451 (edición especial)', 'Ray Bradbury', 'Del Rey', 'Edición 50 aniversario', '2003-01-01', 219.00),
('978-0345342966', 'Guía del autoestopista galáctico', 'Douglas Adams', 'Del Rey', '1ra edición', '1979-10-12', 199.00),
('978-0765326355', 'El nombre del viento', 'Patrick Rothfuss', 'DAW Books', '1ra edición', '2007-03-27', 329.00),
('978-0765311788', 'Mistborn: El imperio final', 'Brandon Sanderson', 'Tor Books', '1ra edición', '2006-07-17', 309.00),
('978-0553573404', 'Juego de tronos', 'George R.R. Martin', 'Bantam', '1ra edición', '1996-08-01', 349.00),
('978-0451169525', 'Salem''s Lot', 'Stephen King', 'Doubleday', '1ra edición', '1975-10-17', 249.00),
('978-0345806789', 'Doctor Sueño', 'Stephen King', 'Scribner', '1ra edición', '2013-09-24', 299.00),
('978-0812505146', 'La llamada de Cthulhu', 'H.P. Lovecraft', 'Del Rey', '1ra edición', '1928-01-01', 179.00),
('978-0345476876', 'Entrevista con el vampiro', 'Anne Rice', 'Ballantine', '1ra edición', '1976-05-05', 229.00),
('978-0062024039', 'La maldición de Hill House', 'Shirley Jackson', 'Penguin', '1ra edición', '1959-01-01', 199.00),
('978-0307454546', 'Los hombres que no amaban a las mujeres', 'Stieg Larsson', 'Vintage', '1ra edición', '2005-08-01', 279.00),
('978-0307949509', 'El laberinto de los espíritus', 'Carlos Ruiz Zafón', 'Vintage', '1ra edición', '2016-11-17', 319.00),
('978-0316769174', 'El silencio de los corderos', 'Thomas Harris', 'St. Martin''s', '1ra edición', '1988-05-01', 249.00),
('978-0307277671', 'En la sangre', 'Truman Capote', 'Vintage', '1ra edición', '1966-01-17', 219.00),
('978-6073139205', 'El complot mongol', 'Rafael Bernal', 'Planeta México', '1ra edición', '1969-01-01', 189.00),
('978-6070734625', 'Temporada de huracanes', 'Fernanda Melchor', 'Random House', '1ra edición', '2017-01-01', 259.00),
('978-6073172042', 'Las batallas en el desierto', 'José Emilio Pacheco', 'Era', '1ra edición', '1981-01-01', 149.00),
('978-6071411839', 'Aura', 'Carlos Fuentes', 'Era', '1ra edición', '1962-01-01', 129.00),
('978-6070747168', 'La región más transparente', 'Carlos Fuentes', 'Alfaguara', '1ra edición', '1958-01-01', 269.00),
('978-6073801652', 'Paradais', 'Fernanda Melchor', 'Random House', '1ra edición', '2021-01-01', 249.00),
('978-0735219090', 'Donde cantan los cangrejos', 'Delia Owens', 'Putnam', '1ra edición', '2018-08-14', 289.00),
('978-1501110368', 'Pequeñas cosas bellas', 'Cheryl Strayed', 'Vintage', '1ra edición', '2012-03-20', 219.00),
('978-0525559481', 'La biblioteca de la medianoche', 'Matt Haig', 'Viking', '1ra edición', '2020-08-13', 279.00),
('978-0593321201', 'Malibu Rising', 'Taylor Jenkins Reid', 'Ballantine', '1ra edición', '2021-06-01', 269.00),
('978-1501161933', 'It Ends with Us', 'Colleen Hoover', 'Atria', '1ra edición', '2016-08-02', 239.00),
('978-0593230251', 'La canción de Aquiles', 'Madeline Miller', 'Ecco', '1ra edición', '2011-09-20', 259.00),
('978-0316556347', 'Circe', 'Madeline Miller', 'Little Brown', '1ra edición', '2018-04-10', 279.00),
('978-0679733782', 'El arte de la guerra', 'Sun Tzu', 'Vintage', 'Edición clásica', '2000-01-01', 149.00),
('978-0140449334', 'Meditaciones', 'Marco Aurelio', 'Penguin Classics', '1ra edición', '2006-01-01', 169.00),
('978-0062457738', 'Un nuevo mundo ahora', 'Eckhart Tolle', 'Penguin', '1ra edición', '2005-01-01', 219.00),
('978-0062316103', 'Hábitos atómicos', 'James Clear', 'Avery', '1ra edición', '2018-10-16', 299.00),
('978-0811215572', 'Antología poética', 'Federico García Lorca', 'New Directions', '1ra edición', '2005-01-01', 179.00),
('978-0374529024', 'Poesía completa', 'Alejandra Pizarnik', 'Lumen', '1ra edición', '2000-01-01', 229.00),
('978-0811223485', 'Piedra de sol', 'Octavio Paz', 'New Directions', '1ra edición', '1957-01-01', 159.00),
('978-0140449136', 'Los viajes de Gulliver', 'Jonathan Swift', 'Penguin Classics', '1ra edición', '1726-10-28', 159.00),
('978-0141439662', 'Robinson Crusoe', 'Daniel Defoe', 'Penguin Classics', '1ra edición', '1719-04-25', 149.00),
('978-0140620085', 'El principito', 'Antoine de Saint-Exupéry', 'Penguin', '1ra edición', '1943-04-06', 139.00)
ON CONFLICT (isbn) DO NOTHING;
