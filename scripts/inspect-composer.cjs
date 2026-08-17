// 诊断：新 inject.css + 聚焦 → 截图验证修复
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const injectCss = fs.readFileSync(path.join(__dirname, '..', 'src', 'main', 'inject.css'), 'utf8')

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1360, height: 860, show: true, x: 40, y: 40 })
  try {
    await win.loadURL('http://127.0.0.1:3080')
    await new Promise((r) => setTimeout(r, 12000))
    await win.webContents.executeJavaScript(`
      (() => {
        const s = document.createElement('style')
        s.id = 'dsh-desktop-inject'
        s.textContent = ${JSON.stringify(injectCss)}
        document.head.appendChild(s)
        const ta = document.querySelector('textarea')
        if (ta) { ta.focus(); ta.dispatchEvent(new Event('focus', { bubbles: true })) }
        return true
      })()
    `)
    await new Promise((r) => setTimeout(r, 900))
    win.show()
    win.focus()
    await new Promise((r) => setTimeout(r, 600))
    const rect = await win.webContents.executeJavaScript(`(() => {
      const card = document.querySelector('[class*="uV2eYG_card"]')
      const r = card.getBoundingClientRect()
      return { x: Math.round(r.x - 60), y: Math.round(r.y - 60), w: Math.round(r.width + 120), h: Math.round(r.height + 120) }
    })()`)
    let region = null
    for (let i = 0; i < 4 && !region; i++) {
      try { region = await win.capturePage({ x: rect.x, y: rect.y, width: rect.w, height: rect.h }) } catch { await new Promise((r) => setTimeout(r, 500)) }
    }
    if (region) fs.writeFileSync(path.join(__dirname, 'composer-fixed.png'), region.toPNG())
    else throw new Error('capture failed')
    // 同时验证按钮圆角与卡片边框色
    const info = await win.webContents.executeJavaScript(`(() => {
      const card = document.querySelector('[class*="uV2eYG_card"]')
      const btn = document.querySelector('button.uV2eYG_primary')
      return {
        cardBorder: getComputedStyle(card).borderColor,
        cardRadius: getComputedStyle(card).borderRadius,
        btnRadius: btn ? getComputedStyle(btn).borderRadius : null,
        btnBg: btn ? getComputedStyle(btn).backgroundColor : null
      }
    })()`)
    fs.writeFileSync(path.join(__dirname, 'inspect-result.json'), JSON.stringify(info, null, 2))
  } catch (e) {
    fs.writeFileSync(path.join(__dirname, 'inspect-result.json'), 'ERROR: ' + (e && e.stack ? e.stack : String(e)))
  }
  await new Promise((r) => setTimeout(r, 300))
  app.quit()
})
