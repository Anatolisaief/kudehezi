import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoDb from 'mongodb';
import { ObjectId } from 'mongodb';


const PORT = 3000;
const app = express();

// Estas líneas son necesarias para obtener __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de la carpeta estática para servir archivos estáticos como si estuvieran en la raíz del servidor
app.use(express.static(path.join(__dirname, 'public')))


// Middleware para procesar datos del formulario
// y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de EJS como motor de plantillasapp.set('view engine', 'ejs');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de la conexión a MongoDB
const conn_str = 'mongodb://localhost:27017';
const client = new mongoDb.MongoClient(conn_str);


//connectar a la base de datos
// y manejar errores de conexión

let conn;

try {
    conn = await client.connect();
    console.log('Conectado a MongoDB');
} catch (err) {
    console.log(err);
    console.log('No se pudo conectar a MongoDB');
}

let db = conn.db('kudehezi'); 

//rutas

app.get('/', (req, res) => {
    res.render('login'); // Renderiza la vista 'login.ejs' en la ruta raíz
});

app.get('/panel', (req, res) => {
    res.render('panel'); // Renderiza la vista 'panel.ejs'
});

app.post('/api/acciones', async (req, res) => {
    try {
        const {
            nombre,
            asociacionEntidad,
            email,
            telefono,
            fechaInicio,
            fechaFin,
            horarios,
            tipoAccion,
            responsableAccion,
            descripcion,
            web
        } = req.body; // Extrae los datos del formulario

        //validación de campos obligatorios
        if (!nombre || !asociacionEntidad || !email || !telefono || !fechaInicio || !fechaFin || !tipoAccion || !responsableAccion) {
            return res.status(400).send('Faltan campos obligatorios');
        }

        //agrupar los datos recibidos del formulario en una sola variable
        const accion = {
            nombre,
            asociacionEntidad,
            email,
            telefono,
            fechaInsercion: new Date(),
            fechaInicio: new Date(fechaInicio),
            fechaFin: new Date(fechaFin),
            horarios,
            tipoAccion,
            responsableAccion,
            descripcion,
            web
        };

        const collection = db.collection('accion');
        // Inserta un nuevo documento en la colección "accion"
        const result = await collection.insertOne(accion);
        console.log('Acción insertada:', result.insertedId);
       /*  res.status(201).send('Acción insertada correctamente'); */
        res.redirect('/panel');
    } catch (error) {
        console.error('Error al insertar la acción', error);
        res.status(500).send('Error al insertar la acción');
    }
});

app.get('/api/acciones', async (req, res) => {
    try {
        const collection = db.collection('accion'); // Selecciona la colección "accion"
        // Obtiene todos los documentos de la colección "accion"
        const accion = await collection.find({}).toArray();
        console.log('accion:', accion);
        res.status(200).json(accion);
    } catch (error) {
        console.error('Error al obtener la acción:', error);
        res.status(500).send('Error al obtener la acción');
    }
});

app.delete('/api/acciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const collection = db.collection('accion'); // Selecciona la colección "accion"
        const result = await collection.deleteOne({ _id: new ObjectId(id) }); // Elimina el documento con el ID proporcionado
        if (result.deletedCount === 1) {
            console.log('Acción eliminada', result);
            res.status(200).send(`Acción eliminada correctamente`);
        } else {
            res.status(404).send('Acción no encontrada');
        }
    } catch (error) {
        console.error('Error al eliminar la acción:', error);
        res.status(500).send('Error al eliminar la acción');
    }
});


app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));