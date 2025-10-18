const { MongoClient } = require('mongodb');

// Usa la misma conexión que en server.js
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('gestion_proyectos');

const User = {
  findOne: async (filter) => await db.collection('users').findOne(filter),
  findById: async (id) => await db.collection('users').findOne({ _id: id })
};

module.exports = { User };