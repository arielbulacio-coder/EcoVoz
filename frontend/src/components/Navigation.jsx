import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Leaf } from 'lucide-react';
import logoUnahur from '../assets/LogoUnahur.png';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <nav className="bg-brand-900 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-lg">
    <Link
  to="/"
  className="flex items-center gap-2"
  aria-label="EcoVoz Urbana, prototipo académico de la comunidad UNAHUR"
>
  <Leaf size={24} aria-hidden="true" />

  <span className="flex flex-col leading-tight">
    <span className="text-xl font-bold">EcoVoz Urbana</span>
    <span className="text-xs font-normal text-green-100">
      Prototipo académico · Comunidad UNAHUR
    </span>
  </span>

  <img
    src={logoUnahur}
    alt="UNAHUR"
    className="h-9 w-9 object-contain bg-white rounded p-1"
  />
</Link>
        {token && (
          <button onClick={handleLogout} aria-label="Cerrar sesión" className="p-2 hover:bg-brand-800 rounded-full transition-colors">
            <LogOut size={20} />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
