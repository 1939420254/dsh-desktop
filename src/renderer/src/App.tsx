import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TitleBar from './components/TitleBar'
import Splash from './components/Splash'
import ErrorCard from './components/ErrorCard'

type Phase = 'starting' | 'connecting' | 'ready' | 'error'

interface ShellState {
  phase: Phase
  message?: string
  url?: string
}

export default function App(): React.JSX.Element {
  const [state, setState] = useState<ShellState>({ phase: 'starting' })
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const offStatus = window.api.onServerStatus((s) => {
      setState((prev) => ({
        ...prev,
        phase: s.state === 'starting' ? 'starting' : 'connecting',
        message: s.state === 'starting' ? '正在启动 DSH 引擎…' : `正在连接 ${s.url ?? ''}…`
      }))
    })
    const offReady = window.api.onServerReady((s) => {
      setState({ phase: 'ready', url: s.url })
    })
    const offError = window.api.onServerError((s) => {
      setState({ phase: 'error', message: s.message })
    })
    window.api.getState().catch(() => undefined)
    return () => {
      offStatus()
      offReady()
      offError()
    }
  }, [])

  return (
    <div className="shell">
      <TitleBar state={state} />
      <div className="shell-content">
        <AnimatePresence
          onExitComplete={() => {
            setSplashDone(true)
            window.api.showView()
          }}
        >
          {state.phase !== 'ready' && (
            <motion.div
              key="splash"
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: 0 }}
            >
              {state.phase === 'error' ? (
                <ErrorCard message={state.message ?? '未知错误'} />
              ) : (
                <Splash state={state} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {state.phase === 'ready' && splashDone && (
          <motion.div
            className="content-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* WebContentsView 由主进程覆盖在此区域之上 */}
          </motion.div>
        )}
      </div>
    </div>
  )
}
