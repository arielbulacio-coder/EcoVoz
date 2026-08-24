import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { syncDrafts } from './utils/offlineSync'

// Sincronizar borradores al iniciar si hay internet
syncDrafts();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
