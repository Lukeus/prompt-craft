import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

// Extend the global Window interface to include our Electron APIs
declare global {
  interface Window {
    electronAPI: any;
    electronEnv: {
      isElectron: boolean;
      nodeVersion: string;
      electronVersion: string;
      platform: string;
    };
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
