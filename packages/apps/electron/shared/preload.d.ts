import { IPCResponse, PromptData, PromptStats, MCPServerStatus, AppSettings } from './ipcChannels';
export interface ElectronAPI {
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
    mcp: {
        startServer: () => Promise<IPCResponse<string>>;
        stopServer: () => Promise<IPCResponse<string>>;
        getStatus: () => Promise<IPCResponse<MCPServerStatus>>;
        onStatusChanged: (callback: (status: MCPServerStatus) => void) => void;
    };
    database: {
        getStats: () => Promise<IPCResponse<PromptStats>>;
        export: (filePath: string) => Promise<IPCResponse<string>>;
        import: (filePath: string) => Promise<IPCResponse<string>>;
        reset: () => Promise<IPCResponse<string>>;
    };
    file: {
        exportPrompts: (filePath: string) => Promise<IPCResponse<string>>;
        importPrompts: (filePath: string) => Promise<IPCResponse<string>>;
        selectFile: (options?: any) => Promise<IPCResponse<string>>;
        selectDirectory: (options?: any) => Promise<IPCResponse<string>>;
    };
    system: {
        getAppVersion: () => Promise<IPCResponse<string>>;
        getPlatform: () => Promise<IPCResponse<string>>;
        minimizeToTray: () => void;
        showFromTray: () => void;
    };
    navigation: {
        goTo: (route: string) => void;
        onNavigateTo: (callback: (route: string) => void) => void;
    };
    notifications: {
        show: (title: string, body: string, options?: any) => void;
        clear: () => void;
    };
    settings: {
        get: () => Promise<IPCResponse<AppSettings>>;
        set: (settings: Partial<AppSettings>) => Promise<IPCResponse<void>>;
        reset: () => Promise<IPCResponse<void>>;
    };
}
export type { ElectronAPI };
//# sourceMappingURL=preload.d.ts.map