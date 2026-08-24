import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, ClipboardList } from 'lucide-react';

const Home = () => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const isOperador = usuario.rol === 'OPERADOR';

  return (
    <div className="flex flex-col gap-4 pt-4">
      <h1 className="text-xl font-bold text-brand-900 mb-2">Bienvenido a EcoVoz Urbana</h1>
      
      <Link to="/nueva" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors">
        <div className="bg-brand-100 text-brand-700 p-3 rounded-full">
          <PlusCircle size={28} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Nueva Observación</h2>
          <p className="text-sm text-gray-500">Registrar una situación ambiental en el campus.</p>
        </div>
      </Link>

      <Link to="/consulta" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors">
        <div className="bg-blue-100 text-blue-700 p-3 rounded-full">
          <Search size={28} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Consultar Estado</h2>
          <p className="text-sm text-gray-500">Buscar seguimiento por código.</p>
        </div>
      </Link>

      {isOperador && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed">
          <div className="bg-purple-100 text-purple-700 p-3 rounded-full">
            <ClipboardList size={28} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Panel de Gestión</h2>
            <p className="text-sm text-gray-500">Módulo no implementado en Etapa 3.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
