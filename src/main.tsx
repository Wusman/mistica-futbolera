import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { LocaleProvider } from './components/LocaleProvider';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user" → Framer respeta el ajuste de movimiento del sistema. */}
    <MotionConfig reducedMotion="user">
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </MotionConfig>
  </StrictMode>,
);