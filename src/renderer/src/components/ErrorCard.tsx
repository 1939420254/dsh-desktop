import { motion } from 'framer-motion'

interface ErrorCardProps {
  message: string
}

export default function ErrorCard({ message }: ErrorCardProps): React.JSX.Element {
  return (
    <div className="error-wrap">
      <motion.div
        className="error-card"
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="error-icon">!</div>
        <h2>无法启动 DSH 服务</h2>
        <p className="error-msg">{message}</p>
        <p className="error-hint">
          请确认本机已安装 Node.js（含 npx），然后重试。
        </p>
        <div className="error-actions">
          <button className="btn-primary" onClick={() => window.api.restartServer()}>
            重试
          </button>
        </div>
      </motion.div>
    </div>
  )
}
