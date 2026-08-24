const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  rol: {
    type: DataTypes.ENUM('EMISOR', 'OPERADOR'),
    defaultValue: 'EMISOR',
  },
});

const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

const Observacion = sequelize.define('Observacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo_seguimiento: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  clave_operacion: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  estado_actual: {
    type: DataTypes.ENUM('RECIBIDA', 'DERIVADA', 'EN_GESTION', 'RESUELTA'),
    defaultValue: 'RECIBIDA',
  },
  ubicacion_metodo: {
    type: DataTypes.ENUM('AUTOMATICA', 'MANUAL', 'MIXTA'),
    allowNull: false,
  },
  ubicacion_referencia: {
    type: DataTypes.STRING,
  },
  ubicacion_latitud: {
    type: DataTypes.FLOAT,
  },
  ubicacion_longitud: {
    type: DataTypes.FLOAT,
  },
});

const HistorialEstado = sequelize.define('HistorialEstado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  estado_origen: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado_destino: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  nota: {
    type: DataTypes.TEXT,
  },
});

// Relaciones
Usuario.hasMany(Observacion, { foreignKey: 'emisor_id' });
Observacion.belongsTo(Usuario, { foreignKey: 'emisor_id' });

Categoria.hasMany(Observacion, { foreignKey: 'categoria_id' });
Observacion.belongsTo(Categoria, { foreignKey: 'categoria_id' });

Observacion.hasMany(HistorialEstado, { foreignKey: 'observacion_id' });
HistorialEstado.belongsTo(Observacion, { foreignKey: 'observacion_id' });

module.exports = {
  Usuario,
  Categoria,
  Observacion,
  HistorialEstado,
  sequelize,
};
