// IPC Channel definitions for type-safe communication between main and renderer processes
export const IPC_CHANNELS = {
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
    SET_FAVORITE: 'prompts:set-favorite',
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
    NAVIGATE_TO: 'navigate-to', // From main to renderer
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

  // Diagnostics and workspace telemetry
  DIAGNOSTICS: {
    GET_SNAPSHOT: 'diagnostics:get-snapshot',
    UPDATED: 'diagnostics:updated',
  },
} as const;

// Type definitions for IPC responses
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Type definitions for prompt data
export interface PromptData {
  id?: string;
  name: string;
  description: string;
  content: string;
  category: 'work' | 'personal' | 'shared';
  tags: string[];
  author?: string;
  version?: string;
  variables?: PromptVariable[];
  createdAt?: string;
  updatedAt?: string;
  isFavorite?: boolean;
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

// Type definitions for prompt statistics
export interface PromptStats {
  total: number;
  work: number;
  personal: number;
  shared: number;
}

export interface DiagnosticsPayload {
  stats: PromptStats;
  activity: Array<{
    id: string;
    name: string;
    description?: string;
    updatedAt: string;
    category: 'work' | 'personal' | 'shared';
    isFavorite?: boolean;
    action: 'created' | 'updated';
  }>;
  source?: string;
  timestamp: string;
}

// Type definitions for MCP server status
export interface MCPServerStatus {
  running: boolean;
  port?: number;
  error?: string;
}

// Type definitions for settings
export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  databasePath: string;
  mcpServerPort: number;
  minimizeToTray: boolean;
  autoStart: boolean;
  keyboardShortcuts: {
    newPrompt: string;
    search: string;
    toggleDevTools: string;
  };
}
