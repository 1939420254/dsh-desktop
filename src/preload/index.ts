import { contextBridge, ipcRenderer } from 'electron'

export interface AppState {
  serverUrl: string
  version: string
}

const api = {
  minimize: (): void => ipcRenderer.send('win:minimize'),
  toggleMaximize: (): void => ipcRenderer.send('win:toggle-maximize'),
  close: (): void => ipcRenderer.send('win:close'),
  showView: (): void => ipcRenderer.send('view:show'),
  restartServer: (): void => ipcRenderer.send('server:restart'),
  getState: (): Promise<AppState> => ipcRenderer.invoke('app:get-state'),
  onServerStatus: (cb: (s: { state: string; url?: string }) => void): (() => void) => {
    const listener = (_e: unknown, payload: { state: string; url?: string }): void => cb(payload)
    ipcRenderer.on('server:status', listener)
    return () => ipcRenderer.removeListener('server:status', listener)
  },
  onServerReady: (cb: (s: { url: string }) => void): (() => void) => {
    const listener = (_e: unknown, payload: { url: string }): void => cb(payload)
    ipcRenderer.on('server:ready', listener)
    return () => ipcRenderer.removeListener('server:ready', listener)
  },
  onServerError: (cb: (s: { message: string }) => void): (() => void) => {
    const listener = (_e: unknown, payload: { message: string }): void => cb(payload)
    ipcRenderer.on('server:error', listener)
    return () => ipcRenderer.removeListener('server:error', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
