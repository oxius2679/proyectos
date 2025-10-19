// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Recibe el cliente como parámetro
module.exports = (client) => {
  const db = client.db('gestion_proyectos');

  const User = {
    findOne: async (filter) => await db.collection('users').findOne(filter),
    findById: async (id) => await db.collection('users').findOne({ _id: id })
  };

  // 👇👇👇 NUEVA RUTA: REGISTRO DE USUARIO 👇👇👇
  router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Validaciones básicas
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'El correo ya está registrado' });
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear el nuevo usuario con rol por defecto
      const newUser = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'viewer' // 👈 ¡Aquí se asigna el rol por defecto!
      };

      // Guardar en la base de datos
      await db.collection('users').insertOne(newUser);

      // Responder con éxito (sin devolver la contraseña ni el token aún)
      res.status(201).json({ message: 'Usuario creado exitosamente' });

    } catch (error) {
      console.error('❌ Error en register:', error);
      res.status(500).json({ error: 'Error del servidor al registrar usuario' });
    }
  });
  // 👆👆👆 FIN DE LA NUEVA RUTA 👆👆👆

  // RUTA EXISTENTE: LOGIN
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name || '',
          email: user.email,
          role: user.role || 'viewer'
        }
      });
    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  });

  return router;
};