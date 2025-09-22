// Register tsconfig paths for module resolution
import 'tsconfig-paths/register';

import { app, BrowserWindow, ipcMain, Menu, shell, Tray, nativeImage } from 'electron';
import * as path from 'path';
import { isDev } from './utils/environment';
import { createWindow } from './window/windowManager';
import { setupIpcHandlers } from './ipc/ipcHandlers';
import { createApplicationMenu } from './menu/applicationMenu';

class PromptCraftElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;

  constructor() {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    // Handle app events
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupApplicationMenu();
      this.setupTray();
      this.setupIpc();
      
      // Handle app activation (macOS)
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    // Handle all windows closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Security: Prevent navigation to external URLs
    app.on('web-contents-created', (_, contents) => {
      contents.on('will-navigate', (navigationEvent, url) => {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
          navigationEvent.preventDefault();
        }
      });

      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });
    });
  }

  private createMainWindow(): void {
    const preloadPath = path.join(__dirname, '../shared/preload.js');
    
    this.mainWindow = createWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
        webSecurity: true,
        sandbox: false,
      },
    });

    // Load the React app
    const startUrl = isDev() 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../renderer/index.html')}`;
    
    this.mainWindow.loadURL(startUrl);

    // Open DevTools in development
    if (isDev()) {
      this.mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle close to tray (minimize functionality can be added later)
    this.mainWindow.on('close', (event: Electron.Event) => {
      if (!(app as any).isQuiting && this.tray) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });
  }

  private setupApplicationMenu(): void {
    const menu = createApplicationMenu({
      onNewPrompt: () => {
        this.mainWindow?.webContents.send('navigate-to', '/prompts/new');
      },
      onOpenPrompts: () => {
        this.mainWindow?.webContents.send('navigate-to', '/prompts');
      },
      onOpenSearch: () => {
        this.mainWindow?.webContents.send('navigate-to', '/search');
      },
      onToggleDevTools: () => {
        this.mainWindow?.webContents.toggleDevTools();
      },
    });
    Menu.setApplicationMenu(menu);
  }

  private setupTray(): void {
    // Create tray icon
    const iconPath = isDev() 
      ? path.join(__dirname, '../../assets/tray-icon.png')
      : path.join(process.resourcesPath, 'assets', 'tray-icon.png');
    
    try {
      const trayIcon = nativeImage.createFromPath(iconPath);
      this.tray = new Tray(trayIcon);

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show Prompt Craft',
          click: () => {
            this.mainWindow?.show();
          }
        },
        {
          label: 'New Prompt',
          click: () => {
            this.mainWindow?.show();
            this.mainWindow?.webContents.send('navigate-to', '/prompts/new');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            (app as any).isQuiting = true;
            app.quit();
          }
        }
      ]);

      this.tray.setContextMenu(contextMenu);
      this.tray.setToolTip('Prompt Craft - AI Prompt Management');

      // Handle double click to show window
      this.tray.on('double-click', () => {
        this.mainWindow?.show();
      });
    } catch (error) {
      console.warn('Could not create tray icon:', error);
      // Continue without tray if icon is missing
    }
  }

  private setupIpc(): void {
    setupIpcHandlers(this.mainWindow);
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}

// Global reference to prevent garbage collection
let electronApp: PromptCraftElectronApp;

// Initialize the app
electronApp = new PromptCraftElectronApp();

export { electronApp };