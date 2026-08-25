import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validación de dominio UNAHUR
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(estudiantes\.)?unahur\.edu\.ar$/;
    if (!emailRegex.test(correo)) {
      setError('Acceso denegado: Debes utilizar un correo institucional (@unahur.edu.ar o @estudiantes.unahur.edu.ar)');
      return;
    }

    try {
      const { data } = await api.post('/auth/login', { correo });
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      navigate('/');
    } catch (err) {
      setError('Error al iniciar sesión. Intenta nuevamente.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full pt-12">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-brand-900 mb-6 text-center">Acceso Institucional</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario / correo institucional *</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 rounded p-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="ejemplo@unahur.edu.ar"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-brand-900 text-white font-medium py-2 rounded hover:bg-brand-800 transition-colors mt-2">
            INGRESAR
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center mt-6">
          RF1 - Acceso institucional restringido.
        </p>
      </div>
    </div>
  );
};

export default Login;
