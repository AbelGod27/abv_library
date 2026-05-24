/**
 * Script para importar ~10,000 libros conocidos desde Open Library
 * Ejecutar: node bd/seed_10000_libros.js
 * 
 * Busca autores famosos, bestsellers y obras clásicas en Open Library
 * e inserta en la base de datos local, omitiendo duplicados.
 */

require("dotenv").config();
const axios = require("axios");
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Autores y términos de libros muy conocidos (mezcla español e internacional)
const TERMINOS = [
    // === AUTORES LATINOAMERICANOS ===
    "Gabriel García Márquez",
    "Jorge Luis Borges",
    "Julio Cortázar",
    "Mario Vargas Llosa",
    "Isabel Allende",
    "Carlos Fuentes",
    "Octavio Paz",
    "Pablo Neruda",
    "Juan Rulfo",
    "Roberto Bolaño",
    "Mario Benedetti",
    "Eduardo Galeano",
    "Laura Esquivel",
    "Ernesto Sabato",
    "Horacio Quiroga",
    "Alejo Carpentier",
    "Augusto Roa Bastos",
    "Elena Poniatowska",
    "Gioconda Belli",
    "Alfonsina Storni",
    "Rubén Darío",
    "José Martí",
    "Gabriela Mistral",
    "César Vallejo",
    "Manuel Puig",
    "Reinaldo Arenas",
    "Álvaro Mutis",
    "José Donoso",
    "Clarice Lispector",
    "Jorge Amado",

    // === AUTORES ESPAÑOLES ===
    "Miguel de Cervantes",
    "Federico García Lorca",
    "Arturo Pérez-Reverte",
    "Rosa Montero",
    "Camilo José Cela",
    "Benito Pérez Galdós",
    "Antonio Machado",
    "Miguel de Unamuno",
    "Pío Baroja",
    "Ana María Matute",
    "Carmen Laforet",
    "Javier Marías",
    "Carlos Ruiz Zafón",
    "Almudena Grandes",
    "Juan Marsé",
    "Eduardo Mendoza",
    "Enrique Vila-Matas",
    "Javier Cercas",
    "María Dueñas",
    "Ildefonso Falcones",

    // === BESTSELLERS INTERNACIONALES ===
    "Stephen King",
    "J.K. Rowling",
    "Dan Brown",
    "Paulo Coelho",
    "Haruki Murakami",
    "George Orwell",
    "Aldous Huxley",
    "Ray Bradbury",
    "Isaac Asimov",
    "Arthur C. Clarke",
    "Agatha Christie",
    "Ken Follett",
    "John Grisham",
    "Tom Clancy",
    "Michael Crichton",
    "James Patterson",
    "Danielle Steel",
    "Nora Roberts",
    "Nicholas Sparks",
    "Suzanne Collins",

    // === CLÁSICOS UNIVERSALES ===
    "William Shakespeare",
    "Charles Dickens",
    "Jane Austen",
    "Mark Twain",
    "Ernest Hemingway",
    "F. Scott Fitzgerald",
    "Virginia Woolf",
    "Franz Kafka",
    "Fyodor Dostoevsky",
    "Leo Tolstoy",
    "Victor Hugo",
    "Alexandre Dumas",
    "Oscar Wilde",
    "Edgar Allan Poe",
    "Herman Melville",
    "Emily Brontë",
    "Charlotte Brontë",
    "James Joyce",
    "Marcel Proust",
    "Albert Camus",

    // === FANTASÍA Y CIENCIA FICCIÓN ===
    "J.R.R. Tolkien",
    "C.S. Lewis",
    "George R.R. Martin",
    "Brandon Sanderson",
    "Patrick Rothfuss",
    "Terry Pratchett",
    "Neil Gaiman",
    "Philip K. Dick",
    "Ursula K. Le Guin",
    "Frank Herbert",
    "Robert A. Heinlein",
    "H.G. Wells",
    "Jules Verne",
    "Orson Scott Card",
    "Douglas Adams",

    // === CONTEMPORÁNEOS POPULARES ===
    "Yuval Noah Harari",
    "Malcolm Gladwell",
    "Nassim Nicholas Taleb",
    "Daniel Kahneman",
    "Steven Pinker",
    "Brené Brown",
    "Michelle Obama",
    "Walter Isaacson",
    "Khaled Hosseini",
    "Chimamanda Ngozi Adichie",
    "Colleen Hoover",
    "Sally Rooney",
    "Donna Tartt",
    "Celeste Ng",
    "Tara Westover",

    // === THRILLER Y MISTERIO ===
    "Stieg Larsson",
    "Jo Nesbø",
    "Henning Mankell",
    "Lee Child",
    "Gillian Flynn",
    "Paula Hawkins",
    "Tana French",
    "Dennis Lehane",
    "Thomas Harris",
    "Patricia Highsmith",

    // === FILOSOFÍA Y PENSAMIENTO ===
    "Friedrich Nietzsche",
    "Jean-Paul Sartre",
    "Simone de Beauvoir",
    "Michel Foucault",
    "Umberto Eco",
    "Noam Chomsky",
    "Hannah Arendt",
    "Byung-Chul Han",
    "Zygmunt Bauman",
    "Slavoj Žižek",

    // === LITERATURA JUVENIL ===
    "Rick Riordan",
    "Veronica Roth",
    "Cassandra Clare",
    "Sarah J. Maas",
    "John Green",
    "Rainbow Rowell",
    "Leigh Bardugo",
    "Victoria Aveyard",
    "Marie Lu",
    "Angie Thomas",

    // === TERROR Y HORROR ===
    "H.P. Lovecraft",
    "Bram Stoker",
    "Mary Shelley",
    "Shirley Jackson",
    "Anne Rice",
    "Clive Barker",
    "Peter Straub",
    "Joe Hill",
    "Paul Tremblay",
    "Mexican Gothic",

    // === NO FICCIÓN POPULAR ===
    "Carl Sagan",
    "Stephen Hawking",
    "Richard Dawkins",
    "Oliver Sacks",
    "Atul Gawande",
    "Robert Greene power",
    "Dale Carnegie",
    "Napoleon Hill",
    "Viktor Frankl",
    "Anne Frank diary",

    // === ROMANCE Y DRAMA ===
    "Gabriel García Márquez amor",
    "Jane Austen pride",
    "Emily Henry",
    "Ali Hazelwood",
    "Taylor Jenkins Reid",
    "Madeline Miller",
    "Delia Owens",
    "Kristin Hannah",
    "Lisa Jewell",
    "Jojo Moyes",

    // === MANGA Y CÓMIC (ediciones en español) ===
    "manga español",
    "novela gráfica español",

    // === TEMAS ADICIONALES PARA VOLUMEN ===
    "best sellers 2020",
    "best sellers 2021",
    "best sellers 2022",
    "best sellers 2023",
    "premio nobel literatura",
    "premio cervantes",
    "premio planeta",
    "booker prize",
    "pulitzer fiction",
    "national book award"
];

const LIMITE_POR_BUSQUEDA = 100; // Máximo que permite Open Library

async function buscarLibros(termino, offset = 0) {
    try {
        const response = await axios.get("https://openlibrary.org/search.json", {
            params: {
                q: termino,
                limit: LIMITE_POR_BUSQUEDA,
                offset,
                fields: "title,author_name,first_publish_year,isbn,publisher"
            },
            timeout: 20000
        });
        return response.data.docs || [];
    } catch (error) {
        console.error(`  ⚠ Error buscando "${termino}" (offset ${offset}):`, error.message);
        return [];
    }
}

function generarPrecio() {
    // Precio aleatorio entre $79 y $899
    return (Math.random() * 820 + 79).toFixed(2);
}

async function insertarLibro(libro) {
    const isbn = libro.isbn ? libro.isbn[0] : null;
    if (!isbn || isbn.length < 10) return false;

    const titulo = (libro.title || "").substring(0, 255);
    if (!titulo) return false;

    const autor = libro.author_name
        ? libro.author_name.slice(0, 3).join(", ").substring(0, 255)
        : "Autor desconocido";
    const editorial = libro.publisher
        ? libro.publisher[0].substring(0, 255)
        : null;
    const anio = libro.first_publish_year || null;
    const precio = generarPrecio();

    try {
        const existe = await pool.query(
            "SELECT 1 FROM libro WHERE isbn = $1",
            [isbn]
        );

        if (existe.rows.length > 0) return false;

        await pool.query(
            `INSERT INTO libro (isbn, titulo, autor, editorial, version, anio_publicacion, precio)
             VALUES ($1, $2, $3, $4, NULL, $5, $6)`,
            [isbn, titulo, autor, editorial, anio, precio]
        );

        return true;
    } catch (err) {
        return false;
    }
}

async function main() {
    const META = 10000;

    console.log("╔══════════════════════════════════════════════╗");
    console.log("║  IMPORTADOR DE 10,000 LIBROS CONOCIDOS      ║");
    console.log("║  Fuente: Open Library API                    ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    let totalImportados = 0;
    let totalOmitidos = 0;
    const inicio = Date.now();

    // RONDA 1: Búsqueda principal (offset 0)
    console.log("── RONDA 1: Búsqueda principal ──\n");

    for (const termino of TERMINOS) {
        if (totalImportados >= META) break;

        process.stdout.write(`🔍 "${termino}" ... `);

        const libros = await buscarLibros(termino, 0);
        let importadosEstaRonda = 0;

        for (const libro of libros) {
            if (totalImportados >= META) break;

            const exito = await insertarLibro(libro);
            if (exito) {
                totalImportados++;
                importadosEstaRonda++;
            } else {
                totalOmitidos++;
            }
        }

        console.log(`+${importadosEstaRonda} (total: ${totalImportados})`);

        // Pausa para no saturar la API
        await new Promise(r => setTimeout(r, 800));
    }

    // RONDA 2: Con offset 100
    if (totalImportados < META) {
        console.log("\n── RONDA 2: Offset 100 ──\n");

        for (const termino of TERMINOS) {
            if (totalImportados >= META) break;

            process.stdout.write(`🔍 "${termino}" [+100] ... `);

            const libros = await buscarLibros(termino, 100);
            let importadosEstaRonda = 0;

            for (const libro of libros) {
                if (totalImportados >= META) break;

                const exito = await insertarLibro(libro);
                if (exito) {
                    totalImportados++;
                    importadosEstaRonda++;
                } else {
                    totalOmitidos++;
                }
            }

            console.log(`+${importadosEstaRonda} (total: ${totalImportados})`);
            await new Promise(r => setTimeout(r, 800));
        }
    }

    // RONDA 3: Con offset 200
    if (totalImportados < META) {
        console.log("\n── RONDA 3: Offset 200 ──\n");

        for (const termino of TERMINOS) {
            if (totalImportados >= META) break;

            process.stdout.write(`🔍 "${termino}" [+200] ... `);

            const libros = await buscarLibros(termino, 200);
            let importadosEstaRonda = 0;

            for (const libro of libros) {
                if (totalImportados >= META) break;

                const exito = await insertarLibro(libro);
                if (exito) {
                    totalImportados++;
                    importadosEstaRonda++;
                } else {
                    totalOmitidos++;
                }
            }

            console.log(`+${importadosEstaRonda} (total: ${totalImportados})`);
            await new Promise(r => setTimeout(r, 800));
        }
    }

    // RONDA 4: Con offset 300
    if (totalImportados < META) {
        console.log("\n── RONDA 4: Offset 300 ──\n");

        for (const termino of TERMINOS.slice(0, 100)) {
            if (totalImportados >= META) break;

            process.stdout.write(`🔍 "${termino}" [+300] ... `);

            const libros = await buscarLibros(termino, 300);
            let importadosEstaRonda = 0;

            for (const libro of libros) {
                if (totalImportados >= META) break;

                const exito = await insertarLibro(libro);
                if (exito) {
                    totalImportados++;
                    importadosEstaRonda++;
                } else {
                    totalOmitidos++;
                }
            }

            console.log(`+${importadosEstaRonda} (total: ${totalImportados})`);
            await new Promise(r => setTimeout(r, 800));
        }
    }

    const duracion = ((Date.now() - inicio) / 1000 / 60).toFixed(1);

    console.log("\n╔══════════════════════════════════════════════╗");
    console.log(`║  ✅ RESULTADO FINAL                          ║`);
    console.log(`║  Libros importados: ${String(totalImportados).padEnd(24)}║`);
    console.log(`║  Libros omitidos:   ${String(totalOmitidos).padEnd(24)}║`);
    console.log(`║  Tiempo total:      ${String(duracion + " minutos").padEnd(24)}║`);
    console.log("╚══════════════════════════════════════════════╝");

    await pool.end();
}

main().catch(err => {
    console.error("Error fatal:", err);
    pool.end();
    process.exit(1);
});
