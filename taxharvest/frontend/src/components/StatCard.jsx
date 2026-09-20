import { motion } from 'framer-motion'

const TONE_STYLES = {
  neutral: 'gradient-neutral',
  gain: 'gradient-gain',
  loss: 'gradient-loss',
}

export default function StatCard({ label, value, subtext, tone = 'neutral', icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className={`glass-card p-6 ${TONE_STYLES[tone]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-th-text-muted uppercase tracking-wide">{label}</span>
        {Icon && <Icon size={16} className="text-th-text-dim" />}
      </div>
      <div className="font-mono-num text-2xl font-semibold text-th-text">{value}</div>
      {subtext && <div className="text-xs text-th-text-muted mt-1.5">{subtext}</div>}
    </motion.div>
  )
}
