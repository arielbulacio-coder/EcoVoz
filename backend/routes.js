const express = require('express');
const jwt = require('jsonwebtoken');
const { Usuario, Categoria, Observacion, HistorialEstado, sequelize } = require('./models');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const JWT_SECRET = 'ecovoz-secret-key'; // En prod, usar variables de entorno

// Middleware de autenticación
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token no válido' });
  }
};

// 1. Login institucional (Simulado)
router.post('/auth/login', async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ error: 'Correo es requerido' });

  let usuario = await Usuario.findOne({ where: { correo } });
  if (!usuario) {
    // Para simplificar el MVP, creamos el usuario si no existe (simulando autenticación)
    usuario = await Usuario.create({ correo, rol: 'EMISOR' });
  }

  const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, usuario });
});

// 2. Obtener categorías activas
router.get('/categorias', authenticate, async (req, res) => {
  const categorias = await Categoria.findAll({ where: { activa: true } });
  res.json(categorias);
});

// 3. Registrar una observación (Idempotente)
router.post('/observaciones', authenticate, async (req, res) => {
  const { categoria_id, descripcion, ubicacion_metodo, ubicacion_referencia, ubicacion_latitud, ubicacion_longitud, clave_operacion } = req.body;
  
  if (!categoria_id || !descripcion || !ubicacion_metodo || !clave_operacion) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const transaction = await sequelize.transaction();

  try {
    // Idempotencia: Verificar si la operación ya existe
    const existe = await Observacion.findOne({ where: { clave_operacion } });
    if (existe) {
      await transaction.rollback();
      return res.json(existe); // Devuelve la respuesta anterior
    }

    const codigo_seguimiento = 'EV-' + new Date().getFullYear() + '-' + Math.random().toString().substring(2, 8);

    const observacion = await Observacion.create({
      codigo_seguimiento,
      clave_operacion,
      descripcion,
      ubicacion_metodo,
      ubicacion_referencia,
      ubicacion_latitud,
      ubicacion_longitud,
      emisor_id: req.user.id,
      categoria_id
    }, { transaction });

    await HistorialEstado.create({
      observacion_id: observacion.id,
      estado_origen: null,
      estado_destino: 'RECIBIDA',
    }, { transaction });

    await transaction.commit();
    res.status(201).json(observacion);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 4. Consultar estado (Público/Anonimizado por código)
router.get('/observaciones/:codigo', async (req, res) => {
  const { codigo } = req.params;
  const observacion = await Observacion.findOne({
    where: { codigo_seguimiento: codigo },
    include: [
      { model: Categoria, attributes: ['nombre'] },
      { model: HistorialEstado, attributes: ['estado_destino', 'fecha_hora'] }
    ]
  });

  if (!observacion) {
    return res.status(404).json({ error: 'No se encontró la observación' });
  }

  // Se devuelve sin exponer datos del emisor
  res.json({
    codigo_seguimiento: observacion.codigo_seguimiento,
    categoria: observacion.Categoria.nombre,
    descripcion: observacion.descripcion,
    estado_actual: observacion.estado_actual,
    ubicacion_metodo: observacion.ubicacion_metodo,
    ubicacion_referencia: observacion.ubicacion_referencia,
    fecha_creacion: observacion.createdAt,
    historial: observacion.HistorialEstados
  });
});

module.exports = router;
