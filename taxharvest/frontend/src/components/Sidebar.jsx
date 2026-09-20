import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, BarChart3, FlaskConical, LogOut, TrendingUp,
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/holdings', label: 'Holdings', icon: Wallet },
  { to: '/results', label: 'Tax Calculation', icon: BarChart3 },
  { to: '/harvest', label: 'Harvest Matrix', icon: FlaskConical },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 border-r border-th-border bg-th-bg-elevated/60 flex flex-col">
      <div className="px-5 py-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-th-blue to-th-green flex items-center justify-center">
          <TrendingUp size={18} className="text-th-bg" strokeWidth={2.5} />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">TaxHarvest</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-th-blue/15 text-th-blue-bright glow-blue'
                  : 'text-th-text-muted hover:text-th-text hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-th-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium truncate">{user?.full_name || user?.email}</p>
          <p className="text-xs text-th-text-dim truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-th-text-muted hover:text-th-red-bright hover:bg-th-red/10 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
