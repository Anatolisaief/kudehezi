import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoDb from 'mongodb';
import { ObjectId } from 'mongodb';
import session from 'express-session';
import bcrypt from 'bcrypt';
import methodOverride from 'method-override';


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
app.use(methodOverride('_method'));

// Configuración de EJS como motor de plantillasapp.set('view engine', 'ejs');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Configuración de la sesión
// Asegúrate de instalar express-session con npm install express-session
app.use(session({
    secret: 'mi_clave_secreta',
    resave: false,
    saveUninitialized: false
}));

// Configuración de la conexión a MongoDB
const conn_str = 'mongodb://localhost:27017';
const client = new mongoDb.MongoClient(conn_str);


//connectar a la base de datos
// y manejar errores de conexión

let conn;
let db;

async function main() {
    try {
        await client.connect();
        console.log('Conectado a MongoDB');
        db = client.db('kudehezi');

        // Aquí define las rutas que usan `db`:
        app.get('/', (req, res) => {
            res.render('login', { error: null, prueba: "enviando datos desde el back" });
        });

        app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
    } catch (err) {
        console.error('Error conectando a MongoDB:', err);
    }
}



app.get('/panel', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.render('panel', { user: req.session.user }); // Renderiza la vista 'panel.ejs' si el usuario está autenticado
});

// ruta para crear un usuario a traves de thunderclient
app.post('/register', async (req, res) => {
     const { nombre, edad, codigoPostal, telefono, email, password } = req.body;

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('users').insertOne({
        nombre,
        edad: parseInt(edad),
        codigoPostal,
        telefono,
        email,
        password: hashedPassword
    });

    res.redirect('/login');
});

// Ruta para mostrar el formulario de registro
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Ruta para mostrar el formulario de login
app.get('/login', (req, res) => {
      res.render('login', { error: null, prueba: 'Hola, prueba de variable' }); 
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email });

    if (!user) return res.render('login', { error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Contraseña incorrecta' });

    req.session.user = user;
    res.redirect('/panel');
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
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

// Ruta para editar una acción
// Esta ruta se usa para mostrar el formulario de edición con los datos de la acción seleccionada
app.get('/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const accion = await db.collection('accion').findOne({ _id: new ObjectId(id) });

        if (!accion) return res.status(404).send('Acción no encontrada');

        // Renderiza la misma vista del formulario pero pasando los datos
        res.render('formulario', {
            accion, // datos de la acción a editar
            editar: true // indicamos que estamos en modo edición
        });
    } catch (error) {
        console.error('Error al cargar la acción para editar:', error);
        res.status(500).send('Error interno');
    }
});

// Ruta para actualizar una acción
// Esta ruta se usa para procesar el formulario de edición y actualizar los datos en la base de datos
app.post('/api/acciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
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
        } = req.body;

        const updatedAccion = {
            nombre,
            asociacionEntidad,
            email,
            telefono,
            fechaInicio: new Date(fechaInicio),
            fechaFin: new Date(fechaFin),
            horarios,
            tipoAccion,
            responsableAccion,
            descripcion,
            web
        };

        const result = await db.collection('accion').updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedAccion }
        );

        //Si se hace clic en editar pero no se cambia nada, igual se redirige normalmente a /panel.
        if (result.matchedCount === 1) {
            res.redirect('/panel');
        } else {
            res.status(404).send('Acción no encontrada');
        }
    } catch (error) {
        console.error('Error al actualizar la acción:', error);
        res.status(500).send('Error al actualizar la acción');
    }
});

// Ruta para eliminar una acción
app.delete('/api/acciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const collection = db.collection('accion'); // Selecciona la colección "accion"
        const result = await collection.deleteOne({ _id: new ObjectId(id) }); // Elimina el documento con el ID proporcionado
        if (result.deletedCount === 1) {
            console.log('Acción eliminada', result);
            res.status(200).json({ success: true, message: 'Acción eliminada correctamente' });
        } else {
            res.status(404).json({ success: false, message: 'Acción no encontrada' });
        }
    } catch (error) {
        console.error('Error al eliminar la acción:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar la acción' });
    }
});




main();