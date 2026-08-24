import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Leaf } from 'lucide-react';

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
        <Link to="/" className="text-xl font-bold flex items-center gap-2">
          <Leaf size={24} />
          EcoVoz Urbana
        </Link>
        {token && (
          <button onClick={handleLogout} className="p-2 hover:bg-brand-800 rounded-full transition-colors">
            <LogOut size={20} />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
