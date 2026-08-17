// 最终验证：当前 inject.css 聚焦后，输入框左右蓝带是否消失
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const injectCss = fs.readFileSync(path.join(__dirname, '..', 'src', 'main', 'inject.css'), 'utf8')

const EXPR = `(async () => {
  const s = document.createElement('style')
  s.textContent = ${JSON.stringify(injectCss)}
  document.head.appendChild(s)
  const rows = [...document.querySelectorAll('[class*="sessionRow"]')]
  if (rows.length) rows[0].click()
  await new Promise((r) => setTimeout(r, 3000))
  const ta = document.querySelector('textarea')
  if (ta) ta.focus()
  await new Promise((r) => setTimeout(r, 800))
  const card = document.querySelector('[class*="uV2eYG_card"]')
  const cr = card.getBoundingClientRect()
  return { card: { x: Math.round(cr.x), y: Math.round(cr.y), w: Math.round(cr.width), h: Math.round(cr.height) } }
})()`

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1360, height: 860, show: true, x: 40, y: 40 })
  try {
    await win.loadURL('http://127.0.0.1:3080')
    await new Promise((r) => setTimeout(r, 12000))
    const res = await win.webContents.executeJavaScript(EXPR)
    fs.writeFileSync(path.join(__dirname, 'inspect-result.json'), JSON.stringify(res, null, 2))
    const card = res.card
    win.show(); win.focus()
    await new Promise((r) => setTimeout(r, 600))
    let region = null
    for (let i = 0; i < 4 && !region; i++) {
      try { region = await win.capturePage({ x: card.x - 90, y: card.y - 90, width: card.w + 180, height: card.h + 180 }) } catch { await new Promise((r) => setTimeout(r, 500)) }
    }
    if (region) fs.writeFileSync(path.join(__dirname, 'composer-final.png'), region.toPNG())
  } catch (e) {
    fs.writeFileSync(path.join(__dirname, 'inspect-result.json'), 'ERROR: ' + (e && e.stack ? e.stack : String(e)))
  }
  await new Promise((r) => setTimeout(r, 300))
  app.quit()
})
