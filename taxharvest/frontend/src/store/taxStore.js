import { create } from 'zustand'
import api from '../lib/api'

const defaultIncome = {
  regime: 'new',
  annual_salary: 5000000,
  other_income: 0,
  section_80_deductions: 0,
  business_expenses: 180000,
  tds_paid: 150000,
}

const sampleHoldings = [
  { id: 'h1', symbol: 'RELIANCE', name: 'Reliance Industries', segment: 'ltcg_equity', quantity: 100, buy_price: 2000, current_price: 2650, buy_date: '2023-04-10' },
  { id: 'h2', symbol: 'INFY', name: 'Infosys', segment: 'ltcg_equity', quantity: 200, buy_price: 2500, current_price: 2275, buy_date: '2023-02-15' },
  { id: 'h3', symbol: 'TATAMOTORS', name: 'Tata Motors', segment: 'stcg_equity', quantity: 300, buy_price: 950, current_price: 780, buy_date: '2026-01-05' },
  { id: 'h4', symbol: 'HDFCBANK', name: 'HDFC Bank', segment: 'stcg_equity', quantity: 150, buy_price: 1650, current_price: 1720, buy_date: '2025-11-20' },
  { id: 'h5', symbol: 'ADANIENT', name: 'Adani Enterprises', segment: 'ltcg_equity', quantity: 50, buy_price: 3200, current_price: 2550, buy_date: '2024-03-01' },
  { id: 'h6', symbol: 'ZOMATO', name: 'Eternal (Zomato)', segment: 'stcg_equity', quantity: 500, buy_price: 280, current_price: 195, buy_date: '2025-09-12' },
]

const sampleSegmentTotals = [
  { segment: 'fno', realized_pnl: 450000, unrealized_pnl: 80000 },
  { segment: 'commodity', realized_pnl: -300000, unrealized_pnl: -40000 },
  { segment: 'currency', realized_pnl: 50000, unrealized_pnl: 5000 },
  { segment: 'intraday', realized_pnl: -60000, unrealized_pnl: 0 },
]

const useTaxStore = create((set, get) => ({
  income: defaultIncome,
  holdings: sampleHoldings,
  segmentTotals: sampleSegmentTotals,
  result: null,
  loading: false,
  error: null,
  usingSampleData: true,

  setIncome(partial) {
    set({ income: { ...get().income, ...partial } })
  },

  setHoldings(holdings) {
    set({ holdings })
  },

  addHolding(holding) {
    set({ holdings: [...get().holdings, { ...holding, id: `h${Date.now()}` }] })
  },

  removeHolding(id) {
    set({ holdings: get().holdings.filter((h) => h.id !== id) })
  },

  async calculate() {
    set({ loading: true, error: null })
    try {
      const { income, holdings, segmentTotals } = get()
      const { data } = await api.post('/calculate', {
        income,
        holdings,
        segment_totals: segmentTotals,
      })
      set({ result: data, loading: false })
      return data
    } catch (e) {
      set({ error: e.response?.data?.detail || 'Calculation failed', loading: false })
      return null
    }
  },
}))

export default useTaxStore
