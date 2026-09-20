export function formatINR(value, opts = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '₹0'
  const { compact = false, showSign = false } = opts
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : showSign && value > 0 ? '+' : ''

  if (compact) {
    if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`
    if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`
    if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`
    return `${sign}₹${abs.toFixed(0)}`
  }

  return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0%'
  return `${value.toFixed(digits)}%`
}

export const SEGMENT_LABELS = {
  ltcg_equity: 'LTCG (Equity)',
  stcg_equity: 'STCG (Equity)',
  ltcg_other: 'LTCG (Other)',
  stcg_other: 'STCG (Other)',
  fno: 'F&O',
  intraday: 'Intraday',
  commodity: 'Commodity',
  currency: 'Currency',
}

export const PRIORITY_LABELS = {
  harvest_first: 'Harvest first',
  monitor: 'Monitor',
  low_priority: 'Low priority',
  ignore: 'Ignore',
}
