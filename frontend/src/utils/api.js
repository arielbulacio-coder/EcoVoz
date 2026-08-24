// utils/api.js - MOCK PARA GITHUB PAGES Y PWA (Sin backend real)
// Simula las respuestas del servidor directamente en el navegador usando LocalStorage

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const api = {
  post: async (url, data) => {
    await delay(600); // Simulamos latencia de red

    if (url === '/auth/login') {
      const { correo } = data;
      // Simulamos que cualquier correo entra. 
      // Si dice 'operador', le damos permisos.
      const usuario = {
        id: Math.floor(Math.random() * 1000),
        correo: correo,
        rol: correo.toLowerCase().includes('operador') ? 'OPERADOR' : 'EMISOR'
      };
      return { data: { token: 'simulated-jwt-token-12345', usuario } };
    }
    
    if (url === '/observaciones') {
      const { categoria_id, descripcion, ubicacion_metodo, ubicacion_referencia, clave_operacion } = data;
      
      // Categorías hardcodeadas para la simulación
      const catMap = {
        1: 'Acumulación de residuos',
        2: 'Pérdidas de agua',
        3: 'Problemas de energía',
        4: 'Contaminación sonora',
        5: 'Daños en espacios verdes',
      };

      const codigo_seguimiento = 'EV-' + new Date().getFullYear() + '-' + Math.random().toString().substring(2, 8);
      
      const newObs = {
        codigo_seguimiento,
        clave_operacion,
        categoria: catMap[categoria_id] || 'Otra situación',
        descripcion,
        estado_actual: 'RECIBIDA',
        ubicacion_metodo,
        ubicacion_referencia: ubicacion_referencia || 'Ubicación automática (GPS)',
        fecha_creacion: new Date().toISOString(),
        historial: [{ estado_destino: 'RECIBIDA', fecha_hora: new Date().toISOString() }]
      };
      
      // Persistimos en la base de datos simulada del navegador
      const saved = JSON.parse(localStorage.getItem('db_observaciones') || '[]');
      
      // Validamos idempotencia (si ya se envió)
      const existe = saved.find(o => o.clave_operacion === clave_operacion);
      if (existe) {
        return { data: existe };
      }

      saved.push(newObs);
      localStorage.setItem('db_observaciones', JSON.stringify(saved));

      return { data: newObs };
    }
    
    const error = new Error('Not found');
    error.response = { status: 404 };
    throw error;
  },
  
  get: async (url) => {
    await delay(500); // Simulamos latencia de red

    if (url === '/categorias') {
      return {
        data: [
          { id: 1, nombre: 'Acumulación de residuos' },
          { id: 2, nombre: 'Pérdidas de agua' },
          { id: 3, nombre: 'Problemas de energía' },
          { id: 4, nombre: 'Contaminación sonora' },
          { id: 5, nombre: 'Daños en espacios verdes' },
        ]
      };
    }
    
    if (url.startsWith('/observaciones/')) {
      const codigo = url.split('/').pop();
      const saved = JSON.parse(localStorage.getItem('db_observaciones') || '[]');
      const obs = saved.find(o => o.codigo_seguimiento === codigo);
      if (obs) {
        return { data: obs };
      } else {
        const error = new Error('Not found');
        error.response = { status: 404 };
        throw error;
      }
    }

    const error = new Error('Not found');
    error.response = { status: 404 };
    throw error;
  }
};

export default api;
