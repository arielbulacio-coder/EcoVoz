import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '../utils/api';
import { saveDraft } from '../utils/offlineSync';

const NuevaObservacion = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    categoria_id: '',
    descripcion: '',
    ubicacion_metodo: 'AUTOMATICA',
    ubicacion_referencia: '',
    ubicacion_latitud: null,
    ubicacion_longitud: null,
  });
  
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsManualLocation, setNeedsManualLocation] = useState(false);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const { data } = await api.get('/categorias');
        setCategorias(data);
      } catch (err) {
        console.error("No se pudieron cargar las categorías, es posible que estemos offline.");
        // Si estamos offline, cargaremos las categorías hardcodeadas para el demo PWA
        setCategorias([
          { id: 1, nombre: 'Acumulación de residuos' },
          { id: 2, nombre: 'Pérdidas de agua' },
          { id: 3, nombre: 'Problemas de energía' },
          { id: 4, nombre: 'Contaminación sonora' },
        ]);
      }
    };
    fetchCategorias();
    getLocation();
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            ubicacion_latitud: position.coords.latitude,
            ubicacion_longitud: position.coords.longitude,
            ubicacion_metodo: 'AUTOMATICA'
          }));
        },
        () => {
          setNeedsManualLocation(true);
          setFormData(prev => ({ ...prev, ubicacion_metodo: 'MANUAL' }));
        }
      );
    } else {
      setNeedsManualLocation(true);
      setFormData(prev => ({ ...prev, ubicacion_metodo: 'MANUAL' }));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoria_id) {
      setError("Error: Falta seleccionar categoría");
      return;
    }

    if (needsManualLocation && !formData.ubicacion_referencia) {
       setError("Error: Debe ingresar una ubicación manual");
       return;
    }

    setIsSubmitting(true);
    setError(null);
    
    // Generar la clave de operación para idempotencia y soporte offline
    const payload = {
      ...formData,
      clave_operacion: uuidv4()
    };

    if (!navigator.onLine) {
      await saveDraft(payload);
      navigate('/confirmacion/offline');
      return;
    }

    try {
      const { data } = await api.post('/observaciones', payload);
      navigate(`/confirmacion/${data.codigo_seguimiento}`);
    } catch (err) {
      console.error(err);
      if (!err.response) { // Falla de red
        await saveDraft(payload);
        navigate('/confirmacion/offline');
      } else {
        setError('No se pudo enviar el reporte. Intenta nuevamente.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-brand-900 bg-brand-50 px-4 py-3 rounded-md">Nueva observación</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
          <select 
            name="categoria_id" 
            value={formData.categoria_id} 
            onChange={handleChange}
            className={`w-full border p-2 rounded focus:ring-brand-500 focus:border-brand-500 bg-white ${error && !formData.categoria_id ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Seleccionar categoría...</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
          <textarea
            name="descripcion"
            required
            rows="3"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Describí brevemente lo observado..."
            className="w-full border border-gray-300 rounded p-2 focus:ring-brand-500 focus:border-brand-500"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
          {!needsManualLocation ? (
             <div className="border border-gray-300 rounded p-3 bg-gray-50 flex items-center gap-3">
               <MapPin className="text-brand-600" />
               <span className="text-sm text-gray-700">Pabellón 3 - Planta baja (GPS)</span>
             </div>
          ) : (
            <input
              type="text"
              name="ubicacion_referencia"
              required
              value={formData.ubicacion_referencia}
              onChange={handleChange}
              placeholder="Ej: Edificio Malvinas, Pasillo, Aula 12"
              className="w-full border border-gray-300 rounded p-2 focus:ring-brand-500 focus:border-brand-500"
            />
          )}
          {!needsManualLocation && (
            <button type="button" onClick={() => setNeedsManualLocation(true)} className="text-brand-700 text-sm mt-1 font-medium">
              ¿Ubicación incorrecta? Ajustar manualmente
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fotografía (opcional)</label>
          <button type="button" className="border border-dashed border-gray-400 text-gray-500 p-4 rounded w-full flex justify-center items-center gap-2 hover:bg-gray-50">
            <Camera size={20} />
            + Foto
          </button>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-brand-700 text-white font-medium py-3 rounded mt-4 hover:bg-brand-800 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'ENVIANDO...' : 'ENVIAR OBSERVACIÓN'}
        </button>
      </form>
    </div>
  );
};

export default NuevaObservacion;
