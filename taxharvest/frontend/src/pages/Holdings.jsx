import { useState } from 'react'
import { motion } from 'framer-motion'
import { Grid3x3, List, Trash2 } from 'lucide-react'
import useTaxStore from '../store/taxStore'
import { formatINR, SEGMENT_LABELS } from '../lib/format'

function holdingTerm(segment, buyDate) {
  const days = (new Date() - new Date(buyDate)) / (1000 * 60 * 60 * 24)
  if (segment.startsWith('ltcg') || segment.startsWith('stcg')) {
    return days > 365 ? 'LTCG' : 'STCG'
  }
  return null
}

function StatusBadge({ segment, buyDate }) {
  const term = holdingTerm(segment, buyDate)
  if (!term) return <span className="text-xs px-2 py-0.5 rounded-full bg-th-blue/15 text-th-blue-bright">{SEGMENT_LABELS[segment]}</span>
  const days = (new Date() - new Date(buyDate)) / (1000 * 60 * 60 * 24)
  const daysToLT = Math.max(0, Math.ceil(365 - days))

  if (term === 'LTCG') {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-th-green/15 text-th-green-bright">LTCG ✓ 12.5%</span>
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-th-amber/15 text-th-amber-bright">
      STCG ⏱ {daysToLT > 0 ? `LT in ${daysToLT}d` : '20%'}
    </span>
  )
}

export default function Holdings() {
  const { holdings, removeHolding } = useTaxStore()
  const [view, setView] = useState('card')

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Holdings</h1>
          <p className="text-th-text-muted text-sm mt-1">{holdings.length} positions tracked</p>
        </div>
        <div className="flex gap-1 bg-th-card border border-th-border rounded-lg p-1">
          <button
            onClick={() => setView('card')}
            className={`p-2 rounded-md transition-colors ${view === 'card' ? 'bg-th-blue/20 text-th-blue-bright' : 'text-th-text-dim hover:text-th-text'}`}
          >
            <Grid3x3 size={16} />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded-md transition-colors ${view === 'table' ? 'bg-th-blue/20 text-th-blue-bright' : 'text-th-text-dim hover:text-th-text'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {view === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {holdings.map((h, i) => {
            const pnl = (h.current_price - h.buy_price) * h.quantity
            const pnlPct = ((h.current_price - h.buy_price) / h.buy_price) * 100
            const isGain = pnl >= 0
            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card p-5 ${isGain ? 'gradient-gain' : 'gradient-loss'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-display font-bold text-base">{h.symbol}</p>
                    <p className="text-xs text-th-text-muted">{h.name}</p>
                  </div>
                  <button
                    onClick={() => removeHolding(h.id)}
                    className="text-th-text-dim hover:text-th-red-bright transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-th-text-muted mb-3">
                  <div>Qty: <span className="font-mono-num text-th-text">{h.quantity}</span></div>
                  <div>Buy: <span className="font-mono-num text-th-text">₹{h.buy_price}</span></div>
                  <div>Current: <span className="font-mono-num text-th-text">₹{h.current_price}</span></div>
                  <div>{StatusBadge({ segment: h.segment, buyDate: h.buy_date })}</div>
                </div>

                <div className="border-t border-th-border pt-3">
                  <p className="text-xs text-th-text-muted mb-0.5">Unrealized P&L</p>
                  <p className={`font-mono-num text-lg font-semibold ${isGain ? 'text-th-green-bright' : 'text-th-red-bright'}`}>
                    {formatINR(pnl, { showSign: true })} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-th-text-muted text-xs">
              <tr>
                {['Symbol', 'Qty', 'Buy Price', 'Current', 'P&L', '%', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const pnl = (h.current_price - h.buy_price) * h.quantity
                const pnlPct = ((h.current_price - h.buy_price) / h.buy_price) * 100
                const isGain = pnl >= 0
                return (
                  <tr key={h.id} className="border-t border-th-border hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{h.symbol}</td>
                    <td className="px-4 py-3 font-mono-num text-th-text-muted">{h.quantity}</td>
                    <td className="px-4 py-3 font-mono-num text-th-text-muted">₹{h.buy_price}</td>
                    <td className="px-4 py-3 font-mono-num text-th-text-muted">₹{h.current_price}</td>
                    <td className={`px-4 py-3 font-mono-num ${isGain ? 'text-th-green-bright' : 'text-th-red-bright'}`}>
                      {formatINR(pnl, { showSign: true })}
                    </td>
                    <td className={`px-4 py-3 font-mono-num ${isGain ? 'text-th-green-bright' : 'text-th-red-bright'}`}>
                      {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge segment={h.segment} buyDate={h.buy_date} />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeHolding(h.id)} className="text-th-text-dim hover:text-th-red-bright">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
