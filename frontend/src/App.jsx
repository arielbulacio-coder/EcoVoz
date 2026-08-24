import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import NuevaObservacion from './pages/NuevaObservacion';
import ConsultaEstado from './pages/ConsultaEstado';
import Confirmacion from './pages/Confirmacion';
import Navigation from './components/Navigation';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-lg">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/nueva" element={<PrivateRoute><NuevaObservacion /></PrivateRoute>} />
            <Route path="/confirmacion/:codigo" element={<PrivateRoute><Confirmacion /></PrivateRoute>} />
            <Route path="/consulta" element={<ConsultaEstado />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
