import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { Search } from 'lucide-react';

const ConsultaEstado = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCode = queryParams.get('codigo') || '';

  const [codigo, setCodigo] = useState(initialCode);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialCode) {
      realizarBusqueda(initialCode);
    }
  }, [initialCode]);

  const realizarBusqueda = async (codigoBuscado) => {
    if (!codigoBuscado) return;
    setIsLoading(true);
    setError('');
    setResultado(null);

    try {
      const { data } = await api.get(`/observaciones/${codigoBuscado}`);
      setResultado(data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('CÓDIGO INEXISTENTE. El código de seguimiento ingresado no existe o es incorrecto.');
      } else {
        setError('Falla de consulta - Problema de red o servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    realizarBusqueda(codigo);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-brand-900 bg-brand-50 px-4 py-3 rounded-md">Consultar estado</h2>
      
      <form onSubmit={handleBuscar} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código de seguimiento</label>
          <input
            type="text"
            required
            className={`w-full border p-3 rounded text-lg font-mono focus:ring-brand-500 focus:border-brand-500 ${error ? 'border-red-500 text-red-700' : 'border-gray-300'}`}
            placeholder="EV-2026-004871"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-brand-900 text-white font-medium py-3 rounded hover:bg-brand-800 transition-colors flex items-center justify-center gap-2"
        >
          <Search size={20} />
          {isLoading ? 'BUSCANDO...' : 'BUSCAR'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg mt-2">
          <p className="font-bold mb-1">Error de consulta</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {resultado && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-100 mt-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500">Categoría</p>
              <p className="font-semibold text-gray-900">{resultado.categoria}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500">Fecha de reporte</p>
            <p className="text-gray-900">{new Date(resultado.fecha_creacion).toLocaleString()}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500">Ubicación</p>
            <p className="text-gray-900">
              {resultado.ubicacion_metodo === 'MANUAL' ? resultado.ubicacion_referencia : 'Ubicación automática (GPS)'}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Estado actual</p>
            <span className={`inline-block px-3 py-1 rounded text-sm font-bold
              ${resultado.estado_actual === 'RECIBIDA' ? 'bg-blue-100 text-blue-800' : 
                resultado.estado_actual === 'EN_GESTION' ? 'bg-yellow-100 text-yellow-800' : 
                resultado.estado_actual === 'RESUELTA' ? 'bg-green-100 text-green-800' : 
                'bg-gray-100 text-gray-800'}`
            }>
              {resultado.estado_actual}
            </span>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Historial de estados:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {resultado.historial && resultado.historial.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand-600">•</span> 
                  {h.estado_destino} <span className="text-gray-400">({new Date(h.fecha_hora).toLocaleDateString()})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultaEstado;
