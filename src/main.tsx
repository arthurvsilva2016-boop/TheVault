import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import { LiveCallProvider } from './context/LiveCallContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <LiveCallProvider>
        <App />
      </LiveCallProvider>
    </LanguageProvider>
  </StrictMode>,
);

