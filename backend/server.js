const express = require('express');
const cors = require('cors');
const { sequelize, Usuario, Categoria } = require('./models');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

const initDB = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Seed data
    await Usuario.bulkCreate([
      { correo: 'estudiante@unahur.edu.ar', rol: 'EMISOR' },
      { correo: 'operador@unahur.edu.ar', rol: 'OPERADOR' },
    ]);

    await Categoria.bulkCreate([
      { nombre: 'Acumulación de residuos' },
      { nombre: 'Pérdidas de agua' },
      { nombre: 'Problemas de energía' },
      { nombre: 'Contaminación sonora' },
      { nombre: 'Daños en espacios verdes' },
    ]);

    console.log('Seed data inserted');
  } catch (error) {
    console.error('Failed to sync db:', error);
  }
};

app.listen(PORT, async () => {
  await initDB();
  console.log(`Server running on port ${PORT}`);
});
