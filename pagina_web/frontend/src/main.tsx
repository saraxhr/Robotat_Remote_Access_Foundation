// ============================================================================
// Archivo: index.tsx
// Propósito: Punto de entrada principal del frontend (React).
//             Renderiza el componente raíz <App /> dentro del DOM.
// ---------------------------------------------------------------------------
// Autora: Sara Hernández 
// Colaborador: ChatGPT (GPT-5) 

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
