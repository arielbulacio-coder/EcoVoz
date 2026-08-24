import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, WifiOff } from 'lucide-react';

const Confirmacion = () => {
  const { codigo } = useParams();
  const isOffline = codigo === 'offline';

  return (
    <div className="flex flex-col items-center justify-center text-center pt-8 gap-6">
      <div className={`p-4 rounded-full ${isOffline ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-brand-600'}`}>
        {isOffline ? <WifiOff size={64} /> : <CheckCircle2 size={64} />}
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800">
        {isOffline ? 'Guardado como borrador' : '¡Observación registrada!'}
      </h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
        {isOffline ? (
          <p className="text-gray-600">
            No hay conexión a internet. El sistema guardará el reporte localmente. Se enviará solo al recuperar Wi-Fi.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-2">Identificador de seguimiento:</p>
            <div className="bg-gray-50 p-3 rounded font-mono text-lg font-bold text-gray-800 border flex justify-between items-center">
              {codigo}
              <button 
                onClick={() => navigator.clipboard.writeText(codigo)}
                className="text-xs bg-brand-700 text-white px-2 py-1 rounded hover:bg-brand-800"
              >
                COPIAR
              </button>
            </div>
            
            <div className="mt-6">
              <Link to="/consulta" className="block w-full bg-brand-900 text-white font-medium py-3 rounded hover:bg-brand-800 transition-colors">
                CONSULTAR ESTADO
              </Link>
            </div>
          </>
        )}
      </div>

      <Link to="/" className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded hover:bg-gray-50 transition-colors">
        VOLVER AL INICIO
      </Link>
    </div>
  );
};

export default Confirmacion;
