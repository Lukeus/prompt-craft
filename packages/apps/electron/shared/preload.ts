import { contextBridge, ipcRenderer } from 'electron';

// Inline IPC channels to avoid module resolution issues in sandboxed preload
const IPC_CHANNELS = {
  // Prompt operations
  PROMPTS: {
    GET_ALL: 'prompts:get-all',
    GET_BY_ID: 'prompts:get-by-id',
    GET_BY_CATEGORY: 'prompts:get-by-category',
    SEARCH: 'prompts:search',
    CREATE: 'prompts:create',
    UPDATE: 'prompts:update',
    DELETE: 'prompts:delete',
    RENDER: 'prompts:render',
  },
  // MCP Server operations
  MCP: {
    START_SERVER: 'mcp:start-server',
    STOP_SERVER: 'mcp:stop-server',
    GET_STATUS: 'mcp:get-status',
    SERVER_STATUS_CHANGED: 'mcp:server-status-changed',
  },
  // Database operations
  DATABASE: {
    GET_STATS: 'database:get-stats',
    EXPORT: 'database:export',
    IMPORT: 'database:import',
    RESET: 'database:reset',
  },
  // File operations
  FILE: {
    EXPORT_PROMPTS: 'file:export-prompts',
    IMPORT_PROMPTS: 'file:import-prompts',
    SELECT_FILE: 'file:select-file',
    SELECT_DIRECTORY: 'file:select-directory',
  },
  // System operations
  SYSTEM: {
    GET_APP_VERSION: 'system:get-app-version',
    GET_PLATFORM: 'system:get-platform',
    MINIMIZE_TO_TRAY: 'system:minimize-to-tray',
    SHOW_FROM_TRAY: 'system:show-from-tray',
  },
  // Navigation
  NAVIGATION: {
    GO_TO: 'navigation:go-to',
    NAVIGATE_TO: 'navigate-to',
  },
  // Notifications
  NOTIFICATIONS: {
    SHOW: 'notifications:show',
    CLEAR: 'notifications:clear',
  },
  // Settings
  SETTINGS: {
    GET: 'settings:get',
    SET: 'settings:set',
    RESET: 'settings:reset',
  },
};

// Type definitions (inline to avoid import issues)
interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PromptData {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  author?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    description?: string;
    defaultValue?: any;
  }>;
}

interface PromptStats {
  total: number;
  categories: Record<string, number>;
  recentActivity: Array<{
    id: string;
    name: string;
    action: 'created' | 'updated' | 'deleted';
    timestamp: string;
  }>;
}

interface MCPServerStatus {
  isRunning: boolean;
  port?: number;
  startTime?: string;
  connections: number;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoStart: boolean;
  minimizeToTray: boolean;
  notifications: boolean;
  defaultCategory: string;
}

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
