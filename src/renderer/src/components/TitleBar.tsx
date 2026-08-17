import { motion } from 'framer-motion'

interface TitleBarProps {
  state: {
    phase: 'starting' | 'connecting' | 'ready' | 'error'
    url?: string
  }
}

const PHASE_META = {
  starting: { label: '启动中', color: '#f59e0b' },
  connecting: { label: '连接中', color: '#f59e0b' },
  ready: { label: '已连接', color: '#22c55e' },
  error: { label: '连接失败', color: '#ef4444' }
} as const

export default function TitleBar({ state }: TitleBarProps): React.JSX.Element {
  const meta = PHASE_META[state.phase]
  const isMax = false // 由主进程窗口状态驱动，这里仅做视觉占位

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <div className="titlebar-logo">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path
              d="M13 2 4.5 13.5h5L11 22l8.5-11.5h-5L13 2Z"
              fill="#fff"
            />
          </svg>
        </div>
        <span className="titlebar-title">DSH Desktop</span>
        <span className="titlebar-version">v0.1.0</span>
        <div className="titlebar-status">
          <motion.span
            className="status-dot"
            style={{ background: meta.color }}
            animate={{ opacity: [1, 0.4, 1], scale: [1, 0.85, 1] }}
            transition={{ duration: state.phase === 'ready' ? 2.4 : 1.2, repeat: Infinity }}
          />
          <span className="status-text" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
      </div>
      <div className="titlebar-right">
        <button
          className="win-btn"
          aria-label="最小化"
          onClick={() => window.api.minimize()}
          title="最小化"
        >
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path d="M2 6.5h8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          className="win-btn"
          aria-label={isMax ? '还原' : '最大化'}
          onClick={() => window.api.toggleMaximize()}
          title={isMax ? '还原' : '最大化'}
        >
          {isMax ? (
            <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
              <path
                d="M4 4V2.5h5.5V8H8"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <rect x="2.5" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
              <rect x="2.5" y="2.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          )}
        </button>
        <button
          className="win-btn win-btn-close"
          aria-label="关闭"
          onClick={() => window.api.close()}
          title="关闭（最小化到托盘）"
        >
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
