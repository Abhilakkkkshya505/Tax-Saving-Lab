import { create } from 'zustand'
import api from '../lib/api'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('th_user') || 'null'),
  token: localStorage.getItem('th_token') || null,
  loading: false,
  error: null,

  async signup(email, password, fullName) {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/signup', { email, password, full_name: fullName })
      localStorage.setItem('th_token', data.access_token)
      localStorage.setItem('th_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
      return true
    } catch (e) {
      set({ error: e.response?.data?.detail || 'Sign up failed', loading: false })
      return false
    }
  },

  async login(email, password) {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('th_token', data.access_token)
      localStorage.setItem('th_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
      return true
    } catch (e) {
      set({ error: e.response?.data?.detail || 'Login failed', loading: false })
      return false
    }
  },

  logout() {
    localStorage.removeItem('th_token')
    localStorage.removeItem('th_user')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
