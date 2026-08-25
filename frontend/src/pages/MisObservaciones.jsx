import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { List, Search, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const MisObservaciones = () => {
  const [observaciones, setObservaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMisObservaciones = async () => {
      try {
        const { data } = await api.get('/mis-observaciones');
        setObservaciones(data);
      } catch (error) {
        console.error("Error al cargar las observaciones", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMisObservaciones();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando tus observaciones...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <List className="text-brand-700" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Mis Observaciones</h2>
      </div>

      {observaciones.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center flex flex-col items-center gap-3">
          <Search size={48} className="text-gray-300" />
          <p className="text-gray-500">No tienes ninguna observación registrada aún.</p>
          <Link to="/nueva" className="text-brand-700 font-medium hover:underline mt-2">
            Crear mi primer reporte
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {observaciones.slice().reverse().map((obs, index) => (
            <Link 
              to={`/consulta?codigo=${obs.codigo_seguimiento}`} 
              key={index}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col gap-2 relative group"
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-gray-800">{obs.categoria}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full
                  ${obs.estado_actual === 'RECIBIDA' ? 'bg-blue-100 text-blue-800' : 
                    obs.estado_actual === 'EN_GESTION' ? 'bg-yellow-100 text-yellow-800' : 
                    obs.estado_actual === 'RESUELTA' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-gray-800'}`
                }>
                  {obs.estado_actual}
                </span>
              </div>
              <div className="text-sm text-gray-600 line-clamp-1">{obs.descripcion}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin size={12} />
                <span>{obs.ubicacion_referencia}</span>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-300 group-hover:text-brand-600 transition-colors">
                <ArrowRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisObservaciones;
