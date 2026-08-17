import { motion } from 'framer-motion'

interface TitleBarProps {
  state: {
    phase: 'starting' | 'connecting' | 'ready' | 'error'
    url?: string
  }
}

const PHASE_META = {
  starting: { label: '启动中', color: '#f59e0b' },
  connecting: { label: '连接中', color: '#22d3ee' },
  ready: { label: '已连接', color: '#34d399' },
  error: { label: '连接失败', color: '#f87171' }
} as const

const spring = { type: 'spring' as const, stiffness: 520, damping: 14 }

export default function TitleBar({ state }: TitleBarProps): React.JSX.Element {
  const meta = PHASE_META[state.phase]

  return (
    <motion.div
      className="titlebar"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="titlebar-left">
        <motion.div
          className="titlebar-logo"
          whileHover={{ scale: 1.18, rotate: 12 }}
          whileTap={{ scale: 0.86, rotate: -8 }}
          transition={spring}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path d="M13 2 4.5 13.5h5L11 22l8.5-11.5h-5L13 2Z" fill="#fff" />
          </svg>
        </motion.div>
        <span className="titlebar-title">DSH Desktop</span>
        <span className="titlebar-version">v0.1.0</span>
        <motion.div
          className="titlebar-status"
          whileHover={{ scale: 1.05 }}
          transition={spring}
        >
          <motion.span
            className="status-dot"
            style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
            animate={{ opacity: [1, 0.35, 1], scale: [1, 0.8, 1] }}
            transition={{ duration: state.phase === 'ready' ? 2.2 : 1.1, repeat: Infinity }}
          />
          <span className="status-text" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </motion.div>
      </div>
      <div className="titlebar-right">
        <motion.button
          className="win-btn"
          aria-label="最小化"
          onClick={() => window.api.minimize()}
          title="最小化"
          whileHover={{ scale: 1.14 }}
          whileTap={{ scale: 0.82 }}
          transition={spring}
        >
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path d="M2 6.5h8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </motion.button>
        <motion.button
          className="win-btn"
          aria-label="最大化/还原"
          onClick={() => window.api.toggleMaximize()}
          title="最大化/还原"
          whileHover={{ scale: 1.14 }}
          whileTap={{ scale: 0.82 }}
          transition={spring}
        >
          <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
            <rect x="2.5" y="2.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </motion.button>
        <motion.button
          className="win-btn win-btn-close"
          aria-label="关闭"
          onClick={() => window.api.close()}
          title="关闭（最小化到托盘）"
          whileHover={{ scale: 1.14 }}
          whileTap={{ scale: 0.82 }}
          transition={spring}
        >
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  )
}
