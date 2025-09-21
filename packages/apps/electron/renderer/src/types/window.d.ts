import { ElectronAPI } from '../../shared/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electronEnv: {
      isElectron: boolean;
      nodeVersion: string;
      electronVersion: string;
      platform: string;
    };
  }
}

export {};