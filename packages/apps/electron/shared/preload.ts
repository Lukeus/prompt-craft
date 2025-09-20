import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, IPCResponse, PromptData, PromptStats, MCPServerStatus, AppSettings } from './ipcChannels';

// Define the API that will be available in the renderer process
export interface ElectronAPI {
  // Prompt operations
  prompts: {
    getAll: () => Promise<IPCResponse<PromptData[]>>;
    getById: (id: string) => Promise<IPCResponse<PromptData>>;
    getByCategory: (category: string) => Promise<IPCResponse<PromptData[]>>;
    search: (query: string, category?: string) => Promise<IPCResponse<PromptData[]>>;
    create: (promptData: Omit<PromptData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IPCResponse<PromptData>>;
    update: (id: string, promptData: Partial<PromptData>) => Promise<IPCResponse<PromptData>>;
    delete: (id: string) => Promise<IPCResponse<void>>;
    render: (id: string, variables: Record<string, any>) => Promise<IPCResponse<string>>;
  };

  // MCP Server operations
  mcp: {
    startServer: () => Promise<IPCResponse<string>>;
    stopServer: () => Promise<IPCResponse<string>>;
    getStatus: () => Promise<IPCResponse<MCPServerStatus>>;
    onStatusChanged: (callback: (status: MCPServerStatus) => void) => void;
  };

  // Database operations
  database: {
    getStats: () => Promise<IPCResponse<PromptStats>>;
    export: (filePath: string) => Promise<IPCResponse<string>>;
    import: (filePath: string) => Promise<IPCResponse<string>>;
    reset: () => Promise<IPCResponse<string>>;
  };

  // File operations
  file: {
    exportPrompts: (filePath: string) => Promise<IPCResponse<string>>;
    importPrompts: (filePath: string) => Promise<IPCResponse<string>>;
    selectFile: (options?: any) => Promise<IPCResponse<string>>;
    selectDirectory: (options?: any) => Promise<IPCResponse<string>>;
  };

  // System operations
  system: {
    getAppVersion: () => Promise<IPCResponse<string>>;
    getPlatform: () => Promise<IPCResponse<string>>;
    minimizeToTray: () => void;
    showFromTray: () => void;
  };

  // Navigation
  navigation: {
    goTo: (route: string) => void;
    onNavigateTo: (callback: (route: string) => void) => void;
  };

  // Notifications
  notifications: {
    show: (title: string, body: string, options?: any) => void;
    clear: () => void;
  };

  // Settings
  settings: {
    get: () => Promise<IPCResponse<AppSettings>>;
    set: (settings: Partial<AppSettings>) => Promise<IPCResponse<void>>;
    reset: () => Promise<IPCResponse<void>>;
  };
}

// Create the API object
const electronAPI: ElectronAPI = {
  prompts: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.PROMPTS.GET_ALL),
    getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROMPTS.GET_BY_ID, id),
    getByCategory: (category: string) => ipcRenderer.invoke(IPC_CHANNELS.PROMPTS.GET_BY_CATEGORY, category),
    search: (query: string, category?: string) => ipcRenderer.invoke(IPC_CHANNELS.PROMPTS.SEARCH, query, category),
    create: (promptData) => ipcRenderer.invoke(IPC_CHANNELS.PROMPTS.CREATE, promptData),
    update: (id: string, promptData) => ipcRenderer.invoke(IPC_CHANNELS.PROMPTS.UPDATE, id, promptData),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROMPTS.DELETE, id),
    render: (id: string, variables) => ipcRenderer.invoke(IPC_CHANNELS.PROMPTS.RENDER, id, variables),
  },

  mcp: {
    startServer: () => ipcRenderer.invoke(IPC_CHANNELS.MCP.START_SERVER),
    stopServer: () => ipcRenderer.invoke(IPC_CHANNELS.MCP.STOP_SERVER),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.MCP.GET_STATUS),
    onStatusChanged: (callback) => {
      ipcRenderer.on(IPC_CHANNELS.MCP.SERVER_STATUS_CHANGED, (_, status) => callback(status));
    },
  },

  database: {
    getStats: () => ipcRenderer.invoke(IPC_CHANNELS.DATABASE.GET_STATS),
    export: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.DATABASE.EXPORT, filePath),
    import: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.DATABASE.IMPORT, filePath),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.DATABASE.RESET),
  },

  file: {
    exportPrompts: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE.EXPORT_PROMPTS, filePath),
    importPrompts: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE.IMPORT_PROMPTS, filePath),
    selectFile: (options) => ipcRenderer.invoke(IPC_CHANNELS.FILE.SELECT_FILE, options),
    selectDirectory: (options) => ipcRenderer.invoke(IPC_CHANNELS.FILE.SELECT_DIRECTORY, options),
  },

  system: {
    getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM.GET_APP_VERSION),
    getPlatform: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM.GET_PLATFORM),
    minimizeToTray: () => ipcRenderer.send(IPC_CHANNELS.SYSTEM.MINIMIZE_TO_TRAY),
    showFromTray: () => ipcRenderer.send(IPC_CHANNELS.SYSTEM.SHOW_FROM_TRAY),
  },

  navigation: {
    goTo: (route: string) => ipcRenderer.send(IPC_CHANNELS.NAVIGATION.GO_TO, route),
    onNavigateTo: (callback) => {
      ipcRenderer.on(IPC_CHANNELS.NAVIGATION.NAVIGATE_TO, (_, route) => callback(route));
    },
  },

  notifications: {
    show: (title: string, body: string, options) => ipcRenderer.send(IPC_CHANNELS.NOTIFICATIONS.SHOW, title, body, options),
    clear: () => ipcRenderer.send(IPC_CHANNELS.NOTIFICATIONS.CLEAR),
  },

  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.GET),
    set: (settings) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.SET, settings),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.RESET),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Expose environment info
contextBridge.exposeInMainWorld('electronEnv', {
  isElectron: true,
  nodeVersion: process.versions.node,
  electronVersion: process.versions.electron,
  platform: process.platform,
});

// Types are automatically available through context bridge
