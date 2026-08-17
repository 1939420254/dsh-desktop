import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface SplashProps {
  state: { phase: string; message?: string }
}

const SPARK_COLORS = ['#a5b4fc', '#f472b6', '#22d3ee', '#c4b5fd']

export default function Splash({ state }: SplashProps): React.JSX.Element {
  const steps = [
    { key: 'start', label: '检测 / 拉起 DSH 引擎' },
    { key: 'connect', label: '连接本地服务' },
    { key: 'load', label: '加载工作区' }
  ]
  const activeIndex = state.phase === 'starting' ? 0 : 1

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: (i * 53) % 100,
        top: 25 + ((i * 37) % 65),
        size: 3 + (i % 3) * 2,
        delay: (i % 9) * 0.55,
        duration: 3.5 + (i % 5),
        color: SPARK_COLORS[i % SPARK_COLORS.length],
        drift: ((i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 6)) % 30
      })),
    []
  )

  return (
    <div className="splash">
      <div className="splash-bg" aria-hidden>
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
        {particles.map((p, i) => (
          <motion.span
            key={i}
            className="spark"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`
            }}
            animate={{
              y: [0, -34, 0],
              x: [0, p.drift, 0],
              opacity: [0, 1, 0],
              scale: [0.6, 1.15, 0.6]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      <motion.div
        className="splash-logo-wrap"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <span className="splash-energy-ring" />
        <span className="splash-logo-halo" />
        <div className="splash-logo">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
            <path d="M13 2 4.5 13.5h5L11 22l8.5-11.5h-5L13 2Z" fill="#fff" />
          </svg>
        </div>
        <motion.span
          className="splash-ring"
          animate={{ scale: [1, 1.55], opacity: [0.7, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.span
          className="splash-ring splash-ring-2"
          animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut', delay: 0.55 }}
        />
      </motion.div>

      <motion.h1
        className="splash-title"
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.12, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      >
        DSH Desktop
      </motion.h1>
      <motion.p
        className="splash-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22, duration: 0.4 }}
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
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 + i * 0.14, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="step-head">
                <motion.span
                  className={`step-dot${done ? ' done' : ''}`}
                  animate={done ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.35 }}
                >
                  {done ? '✓' : active ? <span className="step-spinner" /> : '•'}
                </motion.span>
                <span className="step-label">{s.label}</span>
              </div>
              <div className="step-track">
                <motion.div
                  className="step-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: done ? '100%' : active ? '55%' : '0%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
