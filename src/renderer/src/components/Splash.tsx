import { motion } from 'framer-motion'

interface SplashProps {
  state: { phase: string; message?: string }
}

export default function Splash({ state }: SplashProps): React.JSX.Element {
  const steps = [
    { key: 'start', label: '检测/拉起 DSH 引擎' },
    { key: 'connect', label: '连接本地服务' },
    { key: 'load', label: '加载工作区' }
  ]
  const activeIndex = state.phase === 'starting' ? 0 : 1

  return (
    <div className="splash">
      <div className="splash-bg" aria-hidden>
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
      </div>

      <motion.div
        className="splash-logo-wrap"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="splash-logo">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
            <path d="M13 2 4.5 13.5h5L11 22l8.5-11.5h-5L13 2Z" fill="#fff" />
          </svg>
        </div>
        <motion.span
          className="splash-ring"
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.span
          className="splash-ring splash-ring-2"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
        />
      </motion.div>

      <motion.h1
        className="splash-title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        DSH Desktop
      </motion.h1>
      <motion.p
        className="splash-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        {state.message ?? '正在准备 DeepSeek Harness…'}
      </motion.p>

      <div className="splash-steps">
        {steps.map((s, i) => {
          const done = i < activeIndex
          const active = i === activeIndex
          return (
            <motion.div
              key={s.key}
              className={`splash-step${done ? ' done' : ''}${active ? ' active' : ''}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
            >
              <span className="step-dot">
                {done ? '✓' : active ? <span className="step-spinner" /> : '•'}
              </span>
              <span className="step-label">{s.label}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
