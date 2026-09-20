import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useTaxStore from '../store/taxStore'
import { formatINR, formatPercent } from '../lib/format'

const TABS = ['Summary', 'Detailed Calculation', 'Carry-Forwards']

export default function Results() {
  const { result, calculate, loading } = useTaxStore()
  const [tab, setTab] = useState('Summary')

  useEffect(() => {
    if (!result) calculate()
  }, [])

  if (loading || !result) {
    return <div className="p-8 text-th-text-dim">Calculating…</div>
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">Your Tax Estimate</h1>
      <p className="text-th-text-muted text-sm mb-6">AY 2026-27 · New Regime</p>

      <div className="glass-card gradient-neutral p-8 mb-6 text-center">
        <p className="text-sm text-th-text-muted mb-1">Net Tax Payable</p>
        <p className="font-mono-num text-4xl font-bold">{formatINR(result.net_tax_payable)}</p>
        <p className="text-th-text-muted text-sm mt-1">Effective rate: {formatPercent(result.effective_rate)}</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-th-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-th-blue text-th-blue-bright' : 'border-transparent text-th-text-muted hover:text-th-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Slab Tax', value: result.slab_tax },
              { label: 'STCG Tax', value: result.stcg_tax },
              { label: 'LTCG Tax', value: result.ltcg_tax },
              { label: 'Cess + Surcharge', value: result.cess + result.surcharge },
            ].map((item) => (
              <div key={item.label} className="glass-card p-4">
                <p className="text-xs text-th-text-muted mb-1">{item.label}</p>
                <p className="font-mono-num text-lg font-semibold">{formatINR(item.value, { compact: true })}</p>
              </div>
            ))}
          </div>

          {result.potential_savings > 0 && (
            <div className="glass-card gradient-gain p-5">
              <p className="font-display font-semibold mb-3">💡 You can save {formatINR(result.potential_savings, { compact: true })}</p>
              <div className="space-y-2">
                {result.harvest_opportunities
                  .filter((h) => h.priority === 'harvest_first')
                  .map((h) => (
                    <div key={h.holding_id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                      <span>Harvest <strong>{h.symbol}</strong> ({formatINR(h.unrealized_loss, { compact: true })} loss)</span>
                      <span className="font-mono-num text-th-green-bright">Save {formatINR(h.tax_savings, { compact: true })}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Detailed Calculation' && (
        <div className="glass-card divide-y divide-th-border">
          {result.detailed_lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between px-5 py-3"
            >
              <div>
                <p className="text-sm">{line.label}</p>
                {line.note && <p className="text-xs text-th-text-dim">{line.note}</p>}
              </div>
              <span className={`font-mono-num text-sm ${line.amount < 0 ? 'text-th-red-bright' : 'text-th-text'}`}>
                {formatINR(line.amount, { showSign: true })}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'Carry-Forwards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.carry_forwards.length === 0 ? (
            <p className="text-th-text-dim text-sm">No losses to carry forward — fully utilized this year.</p>
          ) : (
            result.carry_forwards.map((cf, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5"
              >
                <p className="font-display font-semibold">{cf.loss_type.replace('_', ' ')}</p>
                <p className="font-mono-num text-xl font-bold mt-1">{formatINR(cf.amount, { compact: true })}</p>
                <p className="text-xs text-th-text-muted mt-2">
                  Origin: {cf.origin_year} · Expires: {cf.expiry_year} ({cf.years_remaining}-year window)
                </p>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
