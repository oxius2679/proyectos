const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// === Middlewares ===
const corsOptions = {
 origin: [
  'https://starlit-phoenix-8ff1bb.netlify.app', // ✅ Sin espacios
  'http://localhost:8000'
],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Conexión a MongoDB ===
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// === Rutas públicas ===
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend funcionando',
    timestamp: new Date().toISOString()
  });
});

// === Rutas de autenticación ===
const authRoutes = require('./routes/auth')(client); // 👈 Pasa el cliente aquí
app.use('/api/auth', authRoutes);

// === Middleware de autenticación ===
const auth = require('./middleware/auth');

// === Rutas protegidas ===
app.get('/api/projects', auth, async (req, res) => {
  try {
    await client.connect();
    const db = client.db('gestion_proyectos');
    const projectsData = await db.collection('projects').findOne({});
    res.json(projectsData || { projects: [], currentProjectIndex: 0 });
  } catch (error) {
    console.error('Error en GET /api/projects:', error);
    res.status(500).json({ error: 'Error al cargar proyectos' });
  }
});

app.post('/api/projects', auth, async (req, res) => {
  try {
    const { projects, currentProjectIndex } = req.body;
    await client.connect();
    const db = client.db('gestion_proyectos');
    const result = await db.collection('projects').updateOne(
      {},
      { 
        $set: { 
          projects: projects || [],
          currentProjectIndex: currentProjectIndex || 0,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );
    res.json({ success: true, message: 'Datos guardados en MongoDB' });
  } catch (error) {
    console.error('Error en POST /api/projects:', error);
    res.status(500).json({ error: 'Error al guardar proyectos' });
  }
});

// === Iniciar servidor ===
async function startServer() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Conectado a MongoDB Atlas');

    // ✅ SOLO UNA LLAMADA A app.listen(), con '0.0.0.0'
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend corriendo en puerto ${PORT}`);
      console.log('🔐 Rutas protegidas con JWT');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// === Cierre limpio ===
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando conexión con MongoDB...');
  await client.close();
  console.log('👋 Servidor detenido.');
  process.exit(0);
});

// === Iniciar ===
startServer();