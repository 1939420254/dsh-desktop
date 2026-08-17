# DSH Desktop

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 打造的现代化桌面客户端（Electron + React）。

- 🖱️ **双击即用**：双击桌面图标启动，自动探测/拉起本地 `dsh web` 服务并连接
- 🎨 **品牌主题**：以 `#3964fe` 及关联色为基准的圆角平滑风，微动效贯穿
- 🧩 **插件生态完整**：直接加载官方 Web UI，插件市场的主题 / 插件（如 dsh-market）原样可用
- 🖼️ **精细壳层**：无边框窗口 + 自定义标题栏、启动动画、托盘常驻、单实例

## 技术栈

Electron 43 · React 19 · TypeScript · Vite 7（electron-vite）· framer-motion · electron-builder

## 开发

```bash
pnpm install
pnpm dev        # 开发模式（HMR）
pnpm build      # 构建 out/
pnpm build:win  # 产出 NSIS 安装包（dist/）
```

## 架构

```
src/
├─ main/          主进程
│  ├─ index.ts    dsh web 服务探测/拉起、主窗口、WebContentsView、托盘
│  └─ inject.css  注入 DSH Web UI 的 #3964fe 主题层（圆角/动效/滚动条）
├─ preload/       安全桥接（窗口控制、服务状态）
└─ renderer/      壳层 UI（标题栏 + 启动动画 + 错误态）
```

主窗口是壳层 React 应用（自定义标题栏与启动动画）；DSH Web UI 通过
`WebContentsView` 嵌入标题栏下方，并注入 `inject.css` 主题。服务管理策略：

1. 探测 `http://127.0.0.1:3080` 是否已有 DSH 服务 → 有则直接复用
2. 没有则 `npx --yes @deepseek-ai/dsh web` 拉起（复用系统 Node 与现有
   `$DSH_HOME/profiles`，保证与 Web 端一致的插件/主题环境）
3. 退出时仅结束自己拉起的子进程

## 安装包

`pnpm build:win` 产出 `dist/DSH Desktop-Setup-<version>.exe`，NSIS 安装器
会自动创建桌面快捷方式。

> 非官方项目，仅供学习交流。DeepSeek Harness 商标归原项目所有。
