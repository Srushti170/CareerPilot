import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initializeBackendPersistence } from './lib/backendSync';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

async function bootstrapApp() {
  await initializeBackendPersistence();
  createRoot(rootElement).render(
    <App />,
  );
}

bootstrapApp();
