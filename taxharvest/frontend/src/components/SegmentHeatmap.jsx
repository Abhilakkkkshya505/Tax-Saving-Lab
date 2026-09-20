import { SEGMENT_LABELS, formatINR } from '../lib/format'

function colorForValue(value, maxAbs) {
  if (maxAbs === 0) return 'rgba(148,163,184,0.15)'
  const ratio = value / maxAbs // -1 to 1
  if (ratio > 0) {
    const alpha = 0.15 + Math.min(ratio, 1) * 0.5
    return `rgba(16, 185, 129, ${alpha})`
  } else {
    const alpha = 0.15 + Math.min(-ratio, 1) * 0.5
    return `rgba(239, 68, 68, ${alpha})`
  }
}

export default function SegmentHeatmap({ segments }) {
  if (!segments.length) {
    return <div className="h-[220px] flex items-center justify-center text-th-text-dim text-sm">No segment data</div>
  }

  const rows = [
    { key: 'realized_pnl', label: 'Realized P&L' },
    { key: 'unrealized_pnl', label: 'Unrealized P&L' },
    { key: 'tax_impact', label: 'Tax Impact' },
  ]

  const allValues = segments.flatMap((s) => rows.map((r) => s[r.key]))
  const maxAbs = Math.max(...allValues.map(Math.abs), 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate" style={{ borderSpacing: '4px' }}>
        <thead>
          <tr>
            <th className="text-left text-th-text-dim font-normal pb-1 pr-2"></th>
            {segments.map((s) => (
              <th key={s.segment} className="text-th-text-muted font-medium pb-1 text-center whitespace-nowrap px-1">
                {SEGMENT_LABELS[s.segment] || s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="text-th-text-muted whitespace-nowrap pr-2">{row.label}</td>
              {segments.map((s) => (
                <td
                  key={s.segment + row.key}
                  className="rounded-md text-center font-mono-num py-2.5 px-2 min-w-[88px]"
                  style={{ background: colorForValue(s[row.key], maxAbs) }}
                  title={`${SEGMENT_LABELS[s.segment]}: ${formatINR(s[row.key])}`}
                >
                  {formatINR(s[row.key], { compact: true })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
