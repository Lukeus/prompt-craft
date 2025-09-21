export declare const IPC_CHANNELS: {
    readonly PROMPTS: {
        readonly GET_ALL: "prompts:get-all";
        readonly GET_BY_ID: "prompts:get-by-id";
        readonly GET_BY_CATEGORY: "prompts:get-by-category";
        readonly SEARCH: "prompts:search";
        readonly CREATE: "prompts:create";
        readonly UPDATE: "prompts:update";
        readonly DELETE: "prompts:delete";
        readonly RENDER: "prompts:render";
    };
    readonly MCP: {
        readonly START_SERVER: "mcp:start-server";
        readonly STOP_SERVER: "mcp:stop-server";
        readonly GET_STATUS: "mcp:get-status";
        readonly SERVER_STATUS_CHANGED: "mcp:server-status-changed";
    };
    readonly DATABASE: {
        readonly GET_STATS: "database:get-stats";
        readonly EXPORT: "database:export";
        readonly IMPORT: "database:import";
        readonly RESET: "database:reset";
    };
    readonly FILE: {
        readonly EXPORT_PROMPTS: "file:export-prompts";
        readonly IMPORT_PROMPTS: "file:import-prompts";
        readonly SELECT_FILE: "file:select-file";
        readonly SELECT_DIRECTORY: "file:select-directory";
    };
    readonly SYSTEM: {
        readonly GET_APP_VERSION: "system:get-app-version";
        readonly GET_PLATFORM: "system:get-platform";
        readonly MINIMIZE_TO_TRAY: "system:minimize-to-tray";
        readonly SHOW_FROM_TRAY: "system:show-from-tray";
    };
    readonly NAVIGATION: {
        readonly GO_TO: "navigation:go-to";
        readonly NAVIGATE_TO: "navigate-to";
    };
    readonly NOTIFICATIONS: {
        readonly SHOW: "notifications:show";
        readonly CLEAR: "notifications:clear";
    };
    readonly SETTINGS: {
        readonly GET: "settings:get";
        readonly SET: "settings:set";
        readonly RESET: "settings:reset";
    };
};
export interface IPCResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
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
}
export interface PromptVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    description?: string;
    defaultValue?: any;
}
export interface PromptStats {
    total: number;
    work: number;
    personal: number;
    shared: number;
}
export interface MCPServerStatus {
    running: boolean;
    port?: number;
    error?: string;
}
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
//# sourceMappingURL=ipcChannels.d.ts.map