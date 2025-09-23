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

    // Handle all windows closed - Fixed to always quit
    app.on('window-all-closed', () => {
      // Always quit the app when all windows are closed
      app.quit();
    });

    // Handle before quit to ensure proper cleanup
    app.on('before-quit', () => {
      (this as any).isQuitting = true;
    });

    // Security: Enhanced navigation and content security
    app.on('web-contents-created', (_, contents) => {
      // Prevent navigation to external URLs
      contents.on('will-navigate', (navigationEvent, url) => {
        const parsedUrl = new URL(url);
        const allowedOrigins = ['http://localhost:3000', 'file://'];
        
        if (!allowedOrigins.includes(parsedUrl.origin)) {
          console.warn('Blocked navigation to:', url);
          navigationEvent.preventDefault();
        }
      });

      // Handle new window requests securely
      contents.setWindowOpenHandler(({ url }) => {
        // Only allow external links in system browser
        if (url.startsWith('http://') || url.startsWith('https://')) {
          shell.openExternal(url);
        }
        return { action: 'deny' };
      });

      // Prevent file downloads to unauthorized locations
      contents.session.on('will-download', (event, downloadItem) => {
        // Allow downloads but log them for security monitoring
        console.log('Download initiated:', downloadItem.getFilename());
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
        sandbox: false, // Keep disabled for now due to SQLite access needs
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        enableBlinkFeatures: '', // Explicitly disable experimental features
        disableBlinkFeatures: 'Auxclick', // Disable middle-click navigation
        additionalArguments: ['--disable-features=VizDisplayCompositor'],
      },
    });

    // Load the React app
    const startUrl = isDev() 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../../../../renderer/index.html')}`;
    
    console.log('Loading renderer from:', startUrl);
    
    // Load URL with error handling
    this.mainWindow.loadURL(startUrl).catch((error) => {
      console.error('Failed to load renderer:', error);
    });
    
    // Add error event listeners
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Renderer failed to load:', {
        errorCode,
        errorDescription,
        validatedURL
      });
    });
    
    this.mainWindow.webContents.on('did-finish-load', () => {
      console.log('Renderer loaded successfully');
    });

    // Open DevTools in development
    if (isDev()) {
      this.mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Ensure the application exits when the primary window is closed
    this.mainWindow.on('close', () => {
      if (!(this as any).isQuitting) {
        (this as any).isQuitting = true;
        this.tray?.destroy();
        app.quit();
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
            (this as any).isQuitting = true;
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
