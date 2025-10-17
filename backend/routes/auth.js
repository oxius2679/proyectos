// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const router = express.Router();
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro_12345';
const client = new MongoClient(process.env.MONGODB_URI);

let usersCollection;

client.connect().then(() => {
  const db = client.db('gestion_proyectos');
  usersCollection = db.collection('users');
  console.log('✅ Colección de usuarios lista');
}).catch(err => console.error('Error conectando a MongoDB:', err));

// Registro (opcional)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ email, password: hashed, name });
    res.status(201).json({ message: 'Usuario creado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await usersCollection.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;