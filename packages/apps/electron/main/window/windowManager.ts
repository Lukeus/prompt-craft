import { BrowserWindow, screen } from 'electron';
import * as path from 'path';

export interface WindowConfig {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  webPreferences?: Electron.WebPreferences;
}

export const createWindow = (config: WindowConfig): BrowserWindow => {
  // Get primary display dimensions
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  
  const defaultConfig = {
    width: Math.min(config.width || 1200, screenWidth - 100),
    height: Math.min(config.height || 800, screenHeight - 100),
    minWidth: config.minWidth || 800,
    minHeight: config.minHeight || 600,
    show: false, // Don't show until ready
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset' as const,
    vibrancy: 'under-window' as 'under-window', // macOS translucency
    visualEffectState: 'active' as const,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      backgroundThrottling: false,
      ...config.webPreferences,
    },
    icon: path.join(__dirname, '../../assets/app-icon.png'), // App icon
  };

  const window = new BrowserWindow(defaultConfig);

  // Center the window
  window.center();

  // Show window when ready
  window.once('ready-to-show', () => {
    window.show();
    
    // Focus the window
    if (process.platform === 'darwin') {
      window.focus();
    }
  });

  // Save window state
  window.on('resize', () => {
    saveWindowState(window);
  });

  window.on('move', () => {
    saveWindowState(window);
  });

  // Restore window state if available
  restoreWindowState(window);

  return window;
};

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const WINDOW_STATE_KEY = 'window-state';

function saveWindowState(window: BrowserWindow): void {
  try {
    const { app } = require('electron');
    const fs = require('fs');
    const path = require('path');
    
    const bounds = window.getBounds();
    const isMaximized = window.isMaximized();
    
    const windowState: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    };

    const statePath = path.join(app.getPath('userData'), `${WINDOW_STATE_KEY}.json`);
    fs.writeFileSync(statePath, JSON.stringify(windowState));
  } catch (error) {
    console.warn('Failed to save window state:', error);
  }
}

function restoreWindowState(window: BrowserWindow): void {
  try {
    const { app } = require('electron');
    const fs = require('fs');
    const path = require('path');
    
    const statePath = path.join(app.getPath('userData'), `${WINDOW_STATE_KEY}.json`);
    
    if (fs.existsSync(statePath)) {
      const windowState: WindowState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      
      // Validate the state is still valid (screen might have changed)
      const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
      
      if (windowState.width <= screenWidth && windowState.height <= screenHeight) {
        window.setBounds({
          x: windowState.x,
          y: windowState.y,
          width: windowState.width,
          height: windowState.height,
        });
        
        if (windowState.isMaximized) {
          window.maximize();
        }
      }
    }
  } catch (error) {
    console.warn('Failed to restore window state:', error);
  }
}