import { useEffect, useState } from 'react';

export const useElectronAPI = () => {
  const [electronAPI, setElectronAPI] = useState<any>(null);

  useEffect(() => {
    // Check if we're running in Electron and the API is available
    if (window.electronAPI) {
      setElectronAPI(window.electronAPI);
    } else {
      console.warn('Electron API not available - running in web mode');
    }
  }, []);

  return electronAPI;
};

// Type-safe wrapper functions for common operations
export const usePrompts = () => {
  const electronAPI = useElectronAPI();

  const getAllPrompts = async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.getAll();
  };

  const getPromptById = async (id: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.getById(id);
  };

  const createPrompt = async (promptData: any) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.create(promptData);
  };

  const updatePrompt = async (id: string, promptData: any) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.update(id, promptData);
  };

  const deletePrompt = async (id: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.delete(id);
  };

  const searchPrompts = async (query: string, category?: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.search(query, category);
  };

  const getPromptsByCategory = async (category: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.getByCategory(category);
  };

  return {
    getAllPrompts,
    getPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt,
    searchPrompts,
    getPromptsByCategory,
  };
};

export const useDatabase = () => {
  const electronAPI = useElectronAPI();

  const getStats = async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.database.getStats();
  };

  const exportData = async (filePath: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.database.export(filePath);
  };

  const importData = async (filePath: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.database.import(filePath);
  };

  return {
    getStats,
    exportData,
    importData,
  };
};

export const useMCP = () => {
  const electronAPI = useElectronAPI();

  const startServer = async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.mcp.startServer();
  };

  const stopServer = async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.mcp.stopServer();
  };

  const getStatus = async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.mcp.getStatus();
  };

  const onStatusChanged = (callback: (status: any) => void) => {
    if (!electronAPI) return;
    electronAPI.mcp.onStatusChanged(callback);
  };

  return {
    startServer,
    stopServer,
    getStatus,
    onStatusChanged,
  };
};