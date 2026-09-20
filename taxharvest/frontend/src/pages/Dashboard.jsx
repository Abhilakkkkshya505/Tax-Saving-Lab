import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { IndianRupee, TrendingDown, Archive, Target, Upload, Wallet, Share2 } from 'lucide-react'
import useTaxStore from '../store/taxStore'
import StatCard from '../components/StatCard'
import { formatINR } from '../lib/format'
import SegmentHeatmap from '../components/SegmentHeatmap'
import HarvestScatter from '../components/HarvestScatter'

const DONUT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']

export default function Dashboard() {
  const { result, calculate, loading } = useTaxStore()

  useEffect(() => {
    if (!result) calculate()
  }, [])

  const donutData = result
    ? [
        { name: 'Slab Tax', value: result.slab_tax },
        { name: 'STCG Tax', value: result.stcg_tax },
        { name: 'LTCG Tax', value: result.ltcg_tax },
        { name: 'Surcharge + Cess', value: result.surcharge + result.cess },
      ].filter((d) => d.value > 0)
    : []

  const harvestFirstCount = result?.harvest_opportunities?.filter((h) => h.priority === 'harvest_first').length || 0

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <h1 className="font-display text-2xl font-bold">Welcome back 📊</h1>
        <p className="text-th-text-muted text-sm mt-1">Here's your tax position at a glance</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Net Tax Payable"
          value={loading ? '…' : formatINR(result?.net_tax_payable, { compact: true })}
          subtext={result ? `Effective rate ${result.effective_rate.toFixed(1)}%` : ''}
          tone="neutral"
          icon={IndianRupee}
          delay={0}
        />
        <StatCard
          label="Potential Savings"
          value={loading ? '…' : formatINR(result?.potential_savings, { compact: true })}
          subtext="Through tax-loss harvesting"
          tone="gain"
          icon={TrendingDown}
          delay={0.05}
        />
        <StatCard
          label="Carry-Forward Available"
          value={
            loading
              ? '…'
              : formatINR(
                  result?.carry_forwards?.reduce((s, c) => s + c.amount, 0) || 0,
                  { compact: true }
                )
          }
          subtext={`${result?.carry_forwards?.length || 0} loss categories`}
          tone="neutral"
          icon={Archive}
          delay={0.1}
        />
        <StatCard
          label="Harvest Opportunities"
          value={loading ? '…' : `${harvestFirstCount} stocks`}
          subtext="Ready to act on"
          tone={harvestFirstCount > 0 ? 'loss' : 'neutral'}
          icon={Target}
          delay={0.15}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
        {[
          { label: 'Upload Report', icon: Upload },
          { label: 'View Holdings', icon: Wallet },
          { label: 'Start Harvest', icon: Target },
          { label: 'Share with CA', icon: Share2 },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-th-card border border-th-border hover:border-th-blue/50 hover:bg-th-card-hover transition-all text-sm font-medium whitespace-nowrap"
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {result?.audit_threshold_warning && (
        <div className="glass-card gradient-loss p-4 mb-6 flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-th-text">{result.audit_threshold_warning}</p>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold mb-4">Tax Liability Breakdown</h3>
          {result && donutData.length > 0 ? (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatINR(v)}
                    contentStyle={{ background: '#141d31', border: '1px solid #243049', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-th-text-muted">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      {d.name}
                    </span>
                    <span className="font-mono-num text-th-text">{formatINR(d.value, { compact: true })}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-th-text-dim text-sm">Loading…</div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold mb-4">Segment Performance</h3>
          <SegmentHeatmap segments={result?.segment_breakdown || []} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <h3 className="font-display font-semibold mb-4">Harvest Opportunity Matrix</h3>
          <HarvestScatter opportunities={result?.harvest_opportunities || []} />
        </motion.div>
      </div>
    </div>
  )
}
