import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { registrarOffline } from './lib/offline';
import './index.css';

const raiz = document.getElementById('root');
if (raiz) {
  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

registrarOffline();
