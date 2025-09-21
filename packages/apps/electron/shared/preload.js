"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const ipcChannels_1 = require("./ipcChannels");
// Create the API object
const electronAPI = {
    prompts: {
        getAll: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.PROMPTS.GET_ALL),
        getById: (id) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.PROMPTS.GET_BY_ID, id),
        getByCategory: (category) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.PROMPTS.GET_BY_CATEGORY, category),
        search: (query, category) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.PROMPTS.SEARCH, query, category),
        create: (promptData) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.PROMPTS.CREATE, promptData),
        update: (id, promptData) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.PROMPTS.UPDATE, id, promptData),
        delete: (id) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.PROMPTS.DELETE, id),
        render: (id, variables) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.PROMPTS.RENDER, id, variables),
    },
    mcp: {
        startServer: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.MCP.START_SERVER),
        stopServer: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.MCP.STOP_SERVER),
        getStatus: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.MCP.GET_STATUS),
        onStatusChanged: (callback) => {
            electron_1.ipcRenderer.on(ipcChannels_1.IPC_CHANNELS.MCP.SERVER_STATUS_CHANGED, (_, status) => callback(status));
        },
    },
    database: {
        getStats: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.DATABASE.GET_STATS),
        export: (filePath) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.DATABASE.EXPORT, filePath),
        import: (filePath) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.DATABASE.IMPORT, filePath),
        reset: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.DATABASE.RESET),
    },
    file: {
        exportPrompts: (filePath) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.FILE.EXPORT_PROMPTS, filePath),
        importPrompts: (filePath) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.FILE.IMPORT_PROMPTS, filePath),
        selectFile: (options) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.FILE.SELECT_FILE, options),
        selectDirectory: (options) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.FILE.SELECT_DIRECTORY, options),
    },
    system: {
        getAppVersion: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.SYSTEM.GET_APP_VERSION),
        getPlatform: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.SYSTEM.GET_PLATFORM),
        minimizeToTray: () => electron_1.ipcRenderer.send(ipcChannels_1.IPC_CHANNELS.SYSTEM.MINIMIZE_TO_TRAY),
        showFromTray: () => electron_1.ipcRenderer.send(ipcChannels_1.IPC_CHANNELS.SYSTEM.SHOW_FROM_TRAY),
    },
    navigation: {
        goTo: (route) => electron_1.ipcRenderer.send(ipcChannels_1.IPC_CHANNELS.NAVIGATION.GO_TO, route),
        onNavigateTo: (callback) => {
            electron_1.ipcRenderer.on(ipcChannels_1.IPC_CHANNELS.NAVIGATION.NAVIGATE_TO, (_, route) => callback(route));
        },
    },
    notifications: {
        show: (title, body, options) => electron_1.ipcRenderer.send(ipcChannels_1.IPC_CHANNELS.NOTIFICATIONS.SHOW, title, body, options),
        clear: () => electron_1.ipcRenderer.send(ipcChannels_1.IPC_CHANNELS.NOTIFICATIONS.CLEAR),
    },
    settings: {
        get: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.SETTINGS.GET),
        set: (settings) => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.SETTINGS.SET, settings),
        reset: () => electron_1.ipcRenderer.invoke(ipcChannels_1.IPC_CHANNELS.SETTINGS.RESET),
    },
};
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
// Expose environment info
electron_1.contextBridge.exposeInMainWorld('electronEnv', {
    isElectron: true,
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
    platform: process.platform,
});
//# sourceMappingURL=preload.js.map