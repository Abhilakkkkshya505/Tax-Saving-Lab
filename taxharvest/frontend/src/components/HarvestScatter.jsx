import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { formatINR, SEGMENT_LABELS, PRIORITY_LABELS } from '../lib/format'

const PRIORITY_COLORS = {
  harvest_first: '#10b981',
  monitor: '#f59e0b',
  low_priority: '#3b82f6',
  ignore: '#64748b',
}

export default function HarvestScatter({ opportunities }) {
  if (!opportunities.length) {
    return (
      <div className="h-[320px] flex items-center justify-center text-th-text-dim text-sm">
        No unrealized losses to harvest right now 🎉
      </div>
    )
  }

  const data = opportunities.map((o) => ({
    ...o,
    x: o.tax_savings,
    y: o.unrealized_loss,
  }))

  const maxX = Math.max(...data.map((d) => d.x), 1) * 1.15
  const maxY = Math.max(...data.map((d) => d.y), 1) * 1.15

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#243049" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="Tax Savings"
            domain={[0, maxX]}
            tickFormatter={(v) => formatINR(v, { compact: true })}
            stroke="#64748b"
            fontSize={11}
            label={{ value: 'Tax Savings if Harvested →', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Unrealized Loss"
            domain={[0, maxY]}
            tickFormatter={(v) => formatINR(v, { compact: true })}
            stroke="#64748b"
            fontSize={11}
            label={{ value: 'Unrealized Loss →', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
          />
          <ZAxis dataKey="y" range={[120, 500]} />
          <ReferenceLine x={maxX / 2} stroke="#334155" strokeDasharray="2 2" />
          <ReferenceLine y={maxY / 2} stroke="#334155" strokeDasharray="2 2" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ background: '#141d31', border: '1px solid #243049', borderRadius: 8, fontSize: 12 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="bg-th-card border border-th-border rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-th-text">{d.symbol}</p>
                  <p className="text-th-text-muted">{SEGMENT_LABELS[d.segment]}</p>
                  <p>Unrealized loss: <span className="font-mono-num text-th-red-bright">{formatINR(d.y)}</span></p>
                  <p>Tax savings: <span className="font-mono-num text-th-green-bright">{formatINR(d.x)}</span></p>
                  <p className="text-th-text-muted">{PRIORITY_LABELS[d.priority]}</p>
                </div>
              )
            }}
          />
          <Scatter data={data} fillOpacity={0.85}>
            {data.map((d, i) => (
              <Cell key={i} fill={PRIORITY_COLORS[d.priority]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex gap-4 justify-center mt-2 flex-wrap">
        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-th-text-muted">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[key] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
