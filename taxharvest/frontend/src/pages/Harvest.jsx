import { useEffect } from 'react'
import { motion } from 'framer-motion'
import useTaxStore from '../store/taxStore'
import HarvestScatter from '../components/HarvestScatter'
import { formatINR, SEGMENT_LABELS, PRIORITY_LABELS } from '../lib/format'

const PRIORITY_BADGE = {
  harvest_first: 'bg-th-green/15 text-th-green-bright',
  monitor: 'bg-th-amber/15 text-th-amber-bright',
  low_priority: 'bg-th-blue/15 text-th-blue-bright',
  ignore: 'bg-white/5 text-th-text-dim',
}

export default function Harvest() {
  const { result, calculate } = useTaxStore()

  useEffect(() => {
    if (!result) calculate()
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">Harvest Opportunity Matrix</h1>
      <p className="text-th-text-muted text-sm mb-6">Identify which positions to sell for maximum tax savings</p>

      <div className="glass-card p-6 mb-6">
        {result ? <HarvestScatter opportunities={result.harvest_opportunities} /> : <div className="h-[320px]" />}
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-th-text-muted text-xs">
            <tr>
              {['Symbol', 'Segment', 'Unrealized Loss', 'Tax Savings', 'Priority'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(result?.harvest_opportunities || []).map((h, i) => (
              <motion.tr
                key={h.holding_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border-t border-th-border hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 font-medium">{h.symbol}</td>
                <td className="px-4 py-3 text-th-text-muted">{SEGMENT_LABELS[h.segment]}</td>
                <td className="px-4 py-3 font-mono-num text-th-red-bright">{formatINR(h.unrealized_loss)}</td>
                <td className="px-4 py-3 font-mono-num text-th-green-bright">{formatINR(h.tax_savings)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_BADGE[h.priority]}`}>
                    {PRIORITY_LABELS[h.priority]}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
