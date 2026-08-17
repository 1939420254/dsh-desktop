// 验证：聚焦输入框后卡片 animation 为 none、box-shadow 静态
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const injectCss = fs.readFileSync(path.join(__dirname, '..', 'src', 'main', 'inject.css'), 'utf8')

const EXPR = `(async () => {
  const s = document.createElement('style')
  s.textContent = ${JSON.stringify(injectCss)}
  document.head.appendChild(s)
  const ta = document.querySelector('textarea')
  ta.focus()
  await new Promise((r) => setTimeout(r, 400))
  const card = document.querySelector('[class*="uV2eYG_card"]')
  const cs = getComputedStyle(card)
  return {
    animationName: cs.animationName,
    animationDuration: cs.animationDuration,
    borderColor: cs.borderColor,
    boxShadow: cs.boxShadow.slice(0, 160)
  }
})()`

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1360, height: 860, show: true, x: 40, y: 40 })
  try {
    await win.loadURL('http://127.0.0.1:3080')
    await new Promise((r) => setTimeout(r, 12000))
    const res = await win.webContents.executeJavaScript(EXPR)
    fs.writeFileSync(path.join(__dirname, 'inspect-result.json'), JSON.stringify(res, null, 2))
  } catch (e) {
    fs.writeFileSync(path.join(__dirname, 'inspect-result.json'), 'ERROR: ' + (e && e.stack ? e.stack : String(e)))
  }
  await new Promise((r) => setTimeout(r, 300))
  app.quit()
})
