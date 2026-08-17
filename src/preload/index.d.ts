export interface AppState {
  serverUrl: string
  version: string
}

export interface DshApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  showView: () => void
  restartServer: () => void
  getState: () => Promise<AppState>
  onServerStatus: (cb: (s: { state: string; url?: string }) => void) => () => void
  onServerReady: (cb: (s: { url: string }) => void) => () => void
  onServerError: (cb: (s: { message: string }) => void) => () => void
}

declare global {
  interface Window {
    api: DshApi
  }
}

export {}
