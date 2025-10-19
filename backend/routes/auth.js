// routes/auth.js
const express = require('express');
const router = express.Router();

// Recibe el cliente como parámetro
module.exports = (client) => {
  const db = client.db('gestion_proyectos');

  const User = {
    findOne: async (filter) => await db.collection('users').findOne(filter),
    findById: async (id) => await db.collection('users').findOne({ _id: id })
  };

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
    name: user.name || '', // 👈 Si es null, envía una cadena vacía
    email: user.email,
    role: user.role || 'viewer' // 👈 Asegúrate de que role también tenga un valor por defecto
  }
});
    } catch (error) {
      console.error('❌ Error en login:', error); // 👈 Añade este log para ver el error real
      res.status(500).json({ error: 'Error del servidor' });
    }
  });

  return router;
};