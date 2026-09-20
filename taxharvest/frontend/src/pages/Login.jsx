import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-th-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.08),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-card w-full max-w-sm p-8 relative z-10"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-th-blue to-th-green flex items-center justify-center">
            <TrendingUp size={20} className="text-th-bg" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">TaxHarvest</span>
        </div>

        <h1 className="font-display text-xl font-semibold mb-1 text-center">Welcome back</h1>
        <p className="text-sm text-th-text-muted text-center mb-6">Sign in to your tax dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-th-text-muted mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-th-bg-elevated border border-th-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-th-blue/50 focus:border-th-blue transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-th-text-muted mb-1.5 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-th-bg-elevated border border-th-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-th-blue/50 focus:border-th-blue transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-th-red-bright">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-th-blue hover:bg-th-blue-bright transition-colors text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-th-text-muted text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-th-blue-bright hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
