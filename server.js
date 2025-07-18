import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoDb from 'mongodb';
import { ObjectId } from 'mongodb';
import session from 'express-session';
import bcrypt from 'bcrypt';
import dotent from 'dotenv';
import methodOverride from 'method-override';

dotent.config(); // Cargar variables de entorno desde .env
const PORT = process.env.PORT; // Puerto del servidor, se puede configurar en .env
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

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

// Configuración de la conexión a MongoDB
const conn_str = 'mongodb://localhost:27017';
const client = new mongoDb.MongoClient(conn_str);


//connectar a la base de datos
// y manejar errores de conexión

let db;

async function main() {
    try {
        await client.connect();
        console.log('Conectado a MongoDB');
        db = client.db('kudehezi');

        // Aquí define las rutas que usan `db`:
        app.get('/', (req, res) => {
            res.render('login', { error: null, success: null });
        });

        app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
    } catch (err) {
        console.error('Error conectando a MongoDB:', err);
    }
}



app.get('/panel', (req, res) => {
    if (!req.session.user) return res.redirect('/');

    const success = req.session.success;
    delete req.session.success;

    res.render('panel', { user: req.session.user, success });
});

// ruta para crear un usuario a traves de thunderclient
app.post('/register', async (req, res) => {
    const { nombre, fechaNacimiento, codigoPostal, telefono, email, password } = req.body;

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
        req.session.error = 'El usuario ya existe';
        return res.redirect('/register'); // redirige con el error en la sesión
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('users').insertOne({
        nombre,
        fechaNacimiento: new Date(fechaNacimiento),
        codigoPostal,
        telefono,
        email,
        password: hashedPassword
    });

    req.session.success = 'Usuario registrado con éxito';
    res.redirect('/login');
});

// Ruta para mostrar el formulario de registro
app.get('/register', (req, res) => {
    const error = req.session.error;
    delete req.session.error;
    res.render('register', { error });
});

// Ruta para mostrar el formulario de login
app.get('/login', (req, res) => {
    const error = req.session.error;
    const success = req.session.success;
    delete req.session.error; // Elimina el mensaje de error después de mostrarlo
    delete req.session.success;
    res.render('login', { error, success });
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email });

    if (!user) {
        req.session.error = 'Datos incorrectos';
        return res.redirect('/login'); // redirige en lugar de renderizar
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        req.session.error = 'Datos incorrectos';
        return res.redirect('/login');
    }

    req.session.user = user;
    res.redirect('/panel');
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.render('login', { error: null, success: null });
    });
});

// Ruta para mostrar el formulario de acción
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
        if (!nombre || !asociacionEntidad || !telefono) {
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
        req.session.success = 'Acción agregada correctamente';
        res.redirect('/panel');
    } catch (error) {
        console.error('Error al insertar la acción', error);
        res.status(500).send('Error al insertar la acción');
    }
});

app.get('/api/acciones', async (req, res) => {
    try {
        const { tipo, responsable, ordenar, search } = req.query;
        const filtros = [];

        if (tipo && tipo !== 'todos') {
            filtros.push({ tipoAccion: tipo });
        }

        if (responsable && responsable !== 'todos') {
            filtros.push({ responsableAccion: responsable });
        }

        if (search && search.trim() !== '') {
            const regex = new RegExp(search.trim(), 'i');
            filtros.push({
                $or: [
                    { nombre: regex },
                    { descripcion: regex },
                    { asociacionEntidad: regex }
                ]
            });
        }

        const query = filtros.length > 0 ? { $and: filtros } : {};

        const sort = {};
        if (ordenar === 'fechaInicioAsc') sort.fechaInicio = 1;
        else if (ordenar === 'fechaInicioDesc') sort.fechaInicio = -1;
        else if (ordenar === 'nombreAsc') sort.nombre = 1;
        else if (ordenar === 'nombreDesc') sort.nombre = -1;
        else sort._id = -1;

        const acciones = await db.collection('accion')
            .find(query)
            .collation({ locale: 'es', strength: 1 })
            .sort(sort)
            .toArray();

        res.status(200).json(acciones);
    } catch (error) {
        console.error('Error al obtener las acciones:', error);
        res.status(500).send('Error al obtener las acciones');
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
            req.session.success = 'Acción actualizada correctamente';
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
            return res.json({ success: true, message: 'Acción eliminada correctamente' });
        } else {
            return res.status(404).json({ success: false, message: 'Acción no encontrada' });
        }
    } catch (error) {
        console.error('Error al eliminar la acción:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar la acción' });
    }
});


main();