// Simulación mínima de localStorage para ejecutar api.js con Node.
const almacenamiento = new Map();

global.localStorage = {
  getItem(clave) {
    return almacenamiento.has(clave)
      ? almacenamiento.get(clave)
      : null;
  },

  setItem(clave, valor) {
    almacenamiento.set(clave, String(valor));
  },

  removeItem(clave) {
    almacenamiento.delete(clave);
  },

  clear() {
    almacenamiento.clear();
  }
};

const { default: api } =
  await import('../frontend/src/utils/api.js');

localStorage.setItem(
  'usuario',
  JSON.stringify({
    correo: 'prueba@estudiantes.unahur.edu.ar'
  })
);

const payload = {
  categoria_id: 5,
  descripcion: 'Ramas caídas en el patio principal.',
  ubicacion_metodo: 'MANUAL',
  ubicacion_referencia: 'Patio principal sede Origone',
  id_operacion: 'prueba-idempotencia-001'
};

console.log('Primer envío...');
const primeraRespuesta =
  await api.post('/observaciones', payload);

console.log('Segundo envío con el mismo id_operacion...');
const segundaRespuesta =
  await api.post('/observaciones', payload);

const observaciones = JSON.parse(
  localStorage.getItem('db_observaciones') || '[]'
);

console.log(
  'Código del primer envío:',
  primeraRespuesta.data.codigo_seguimiento
);

console.log(
  'Código del segundo envío:',
  segundaRespuesta.data.codigo_seguimiento
);

console.log(
  'Cantidad de observaciones almacenadas:',
  observaciones.length
);

const mismoCodigo =
  primeraRespuesta.data.codigo_seguimiento ===
  segundaRespuesta.data.codigo_seguimiento;

const pruebaCorrecta =
  mismoCodigo && observaciones.length === 1;

if (pruebaCorrecta) {
  console.log(
    'PRUEBA EXITOSA: el reintento no generó duplicados.'
  );
  process.exit(0);
} else {
  console.error(
    'PRUEBA FALLIDA: se generó una observación duplicada.'
  );
  process.exit(1);
}