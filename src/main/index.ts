import { app, BrowserWindow, WebContentsView, Tray, Menu, nativeImage, ipcMain, shell } from 'electron'
import { spawn, exec } from 'node:child_process'
import http from 'node:http'
import { join } from 'node:path'
import fs from 'node:fs'
import injectCss from './inject.css?raw'

/* ------------------------------------------------------------------ *
 *  DSH Desktop — DeepSeek Harness 桌面客户端
 *  主进程：负责 dsh web 服务的探测/拉起、主窗口、WebContentsView、
 *  托盘、单实例与退出清理。
 * ------------------------------------------------------------------ */

const APP_ID = 'com.dsh.desktop'
const TITLE_BAR_HEIGHT = 48
const DEFAULT_PORT = 3080
const DEFAULT_HOST = '127.0.0.1'
const SERVER_URL = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`
const LOG_PATH = () => join(app.getPath('userData'), 'main.log')
const SPAWN_LOCK = join(app.getPath('userData'), 'server-spawned.lock')

let mainWindow: BrowserWindow | null = null
let dshView: WebContentsView | null = null
let tray: Tray | null = null
let serverChild: ReturnType<typeof spawn> | null = null
let serverSpawnedByUs = false
let quitting = false

function log(msg: string): void {
  try {
    fs.appendFileSync(LOG_PATH(), `${new Date().toISOString()}  ${msg}\n`)
  } catch {
    /* ignore */
  }
  console.log(`[dsh-desktop] ${msg}`)
}

/* ---------------- 服务管理 ---------------- */

/** 探测某个 URL 是否已经是可用的 DSH web 服务。 */
function probe(url: string, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = ''
      res.on('data', (c) => {
        body += c
        if (body.length > 8192) req.destroy()
      })
      res.on('end', () => {
        const ok =
          res.statusCode !== undefined &&
          res.statusCode < 500 &&
          /dsh|deepseek/i.test(body)
        resolve(ok)
      })
      res.on('error', () => resolve(false))
    })
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.on('error', () => resolve(false))
  })
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await probe(url, 1500)) return true
    await new Promise((r) => setTimeout(r, 800))
  }
  return false
}

function resolveDshHome(): string {
  return process.env.DSH_HOME || join(app.getPath('home'), '.dsh')
}

/** 拉起 dsh web 服务（复用系统 node + npx，保证与用户现有 profile 一致）。 */
function startServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, DSH_HOME: resolveDshHome() }
    log(`spawning dsh web (DSH_HOME=${env.DSH_HOME})`)
    serverChild = spawn('npx', ['--yes', '@deepseek-ai/dsh', 'web'], {
      env,
      shell: process.platform === 'win32',
      windowsHide: true
    })
    serverSpawnedByUs = true

    let urlSeen = ''
    const onData = (chunk: Buffer | string) => {
      const text = chunk.toString()
      process.stdout.write(text)
      const m = /https?:\/\/[^\s"'`]+/.exec(text)
      if (m && !urlSeen) {
        urlSeen = m[0].replace(/[),;]+$/, '')
        log(`dsh web url: ${urlSeen}`)
        resolve(urlSeen)
      }
    }
    serverChild?.stdout?.on('data', onData)
    serverChild?.stderr?.on('data', onData)
    serverChild?.on('error', (err) => {
      log(`failed to spawn npx: ${err.message}`)
      reject(err)
    })
    serverChild?.on('exit', (code) => {
      if (quitting) return
      log(`dsh web exited early with code ${code}`)
      reject(new Error(`dsh web exited with code ${code}`))
    })

    // 兜底：若输出里没抓到 URL，等端口就绪后返回默认地址
    waitForServer(SERVER_URL, 60_000).then((ok) => {
      if (ok && !urlSeen) {
        urlSeen = SERVER_URL
        resolve(SERVER_URL)
      } else if (!ok && !urlSeen) {
        reject(new Error('server did not become ready in time'))
      }
    })
  })
}

/** 返回可用的 DSH web 地址：优先复用已在跑的实例，否则自己拉起。 */
async function ensureServer(): Promise<string> {
  if (await probe(SERVER_URL, 1200)) {
    log('existing dsh web detected, reusing')
    return SERVER_URL
  }
  try {
    return await startServer()
  } catch (err) {
    // 可能 npx 拉起的服务端口与默认不同，最终仍用默认端口探测一次
    if (await waitForServer(SERVER_URL, 15_000)) return SERVER_URL
    throw err
  }
}

function stopServer(): void {
  if (serverChild && serverSpawnedByUs && !serverChild.killed) {
    log('stopping dsh web child')
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /PID ${serverChild.pid} /T /F`, () => undefined)
      } else {
        serverChild.kill('SIGTERM')
      }
    } catch {
      /* ignore */
    }
  }
  serverChild = null
}

/* ---------------- 窗口 / 视图 ---------------- */

function send(channel: string, payload: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

function applyViewBounds(): void {
  if (!mainWindow || !dshView || mainWindow.isDestroyed()) return
  const [w, h] = mainWindow.getContentSize()
  dshView.setBounds({ x: 0, y: TITLE_BAR_HEIGHT, width: w, height: Math.max(0, h - TITLE_BAR_HEIGHT) })
}

function attachView(url: string): void {
  if (dshView) {
    dshView.webContents.loadURL(url)
    return
  }
  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })
  dshView = view
  view.setVisible(false)
  mainWindow?.contentView.addChildView(view)
  applyViewBounds()

  const wc = view.webContents
  wc.on('dom-ready', () => {
    wc.insertCSS(injectCss).catch(() => undefined)
  })
  wc.on('did-finish-load', () => {
    // 先保持隐藏，等壳层 splash 淡出后再由 view:show 显示
    send('server:ready', { url })
    log(`DSH UI loaded: ${url}`)
  })
  wc.on('did-fail-load', (_e, code, desc) => {
    log(`did-fail-load ${code} ${desc}`)
  })
  wc.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith('http')) shell.openExternal(target)
    return { action: 'deny' }
  })
  view.setBackgroundColor('#0f172a')
  wc.loadURL(url)
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 620,
    show: false,
    frame: false,
    roundedCorners: true,
    backgroundColor: '#0b1220',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })
  mainWindow.on('resize', applyViewBounds)
  mainWindow.on('maximize', applyViewBounds)
  mainWindow.on('unmaximize', applyViewBounds)
  mainWindow.on('close', (e) => {
    if (!quitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/* ---------------- 托盘 ---------------- */

function createTray(): void {
  const icon = nativeImage.createFromPath(join(__dirname, '../../resources/tray.png'))
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('DSH Desktop — DeepSeek Harness')
  const menu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => showMain() },
    { label: '在浏览器打开', click: () => shell.openExternal(SERVER_URL) },
    { type: 'separator' },
    {
      label: '重启 DSH 服务',
      click: () => {
        stopServer()
        restartFlow()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        quitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.on('double-click', () => showMain())
}

function showMain(): void {
  if (!mainWindow) return
  mainWindow.show()
  mainWindow.focus()
}

/* ---------------- 启动流程 ---------------- */

async function boot(): Promise<void> {
  send('server:status', { state: 'starting' })
  try {
    const url = await ensureServer()
    attachView(url)
    send('server:status', { state: 'connecting', url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log(`boot failed: ${msg}`)
    send('server:error', { message: msg })
  }
}

async function restartFlow(): Promise<void> {
  if (dshView) {
    dshView.setVisible(false)
  }
  await boot()
}

/* ---------------- IPC ---------------- */

function registerIpc(): void {
  ipcMain.on('win:minimize', () => mainWindow?.minimize())
  ipcMain.on('win:toggle-maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('win:close', () => {
    if (!mainWindow) return
    mainWindow.hide()
  })
  ipcMain.on('view:show', () => {
    if (dshView) dshView.setVisible(true)
  })
  ipcMain.on('server:restart', () => {
    restartFlow().catch(() => undefined)
  })
  ipcMain.handle('app:get-state', () => ({
    serverUrl: SERVER_URL,
    version: app.getVersion()
  }))
}

/* ---------------- 生命周期 ---------------- */

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => showMain())

  app.whenReady().then(() => {
    app.setAppUserModelId(APP_ID)
    registerIpc()
    createMainWindow()
    createTray()
    boot().catch((err) => {
      log(`boot error: ${err instanceof Error ? err.message : String(err)}`)
    })
  })

  app.on('window-all-closed', () => {
    // 托盘常驻：不退出
  })

  app.on('before-quit', () => {
    quitting = true
    stopServer()
  })

  app.on('activate', () => {
    if (mainWindow) showMain()
  })
}
