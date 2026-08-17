// ASCII 渲染截图区域，看清蓝色形状
const sharp = require('C:/Users/19394/.dsh/profiles/node_modules/sharp')

async function renderRegion(region, label) {
  const img = sharp('D:/dshn/workbench/dsh-desktop/scripts/composer-shot.png')
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  const [x0, y0, x1, y1] = region
  const chars = []
  for (let y = y0; y <= y1; y++) {
    let line = ''
    for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * info.channels
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (b > 170 && b - r > 50 && b - g > 40) line += 'B'
      else if (r > 245 && g > 245 && b > 245) line += '.'
      else if (r < 60 && g < 70 && b < 90) line += '#'
      else if (r > 200 && g > 200 && b > 200) line += ','
      else if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12) line += ':'
      else line += 'o'
    }
    chars.push(line)
  }
  console.log(`\n===== ${label} (${x0},${y0})-(${x1},${y1}) =====`)
  console.log(chars.join('\n'))
}

async function main() {
  // 先找出所有蓝色区域的实际范围（复用之前的连通域）
  const img = sharp('D:/dshn/workbench/dsh-desktop/scripts/composer-shot.png')
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height
  const isBlue = (x, y) => {
    const i = (y * W + x) * info.channels
    const r = data[i], g = data[i + 1], b = data[i + 2]
    return b > 170 && b - r > 50 && b - g > 40
  }
  await renderRegion([52, 62, 150, 132], 'LEFT TOP AREA')
  await renderRegion([790, 62, 850, 132], 'RIGHT TOP AREA')
  await renderRegion([770, 126, 830, 176], 'SEND BUTTON')
  await renderRegion([0, 0, 60, 237], 'LEFT EDGE STRIP')
  await renderRegion([824, 0, 883, 237], 'RIGHT EDGE STRIP')
}

main().catch((e) => { console.error(e); process.exit(1) })
