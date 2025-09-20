"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
// IPC Channel definitions for type-safe communication between main and renderer processes
exports.IPC_CHANNELS = {
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
};
//# sourceMappingURL=ipcChannels.js.map