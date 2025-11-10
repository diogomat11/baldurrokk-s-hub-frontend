import axios from 'axios'
import { supabase } from '@/services/supabase/client'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const api = axios.create({
  baseURL,
  withCredentials: true,
})

api.interceptors.request.use(async (config) => {
  try {
    // Fallback dev: usar tokens armazenados localmente quando Supabase não está configurado
    const devAccess = typeof window !== 'undefined' ? localStorage.getItem('dev_access_token') : null
    const devRefresh = typeof window !== 'undefined' ? localStorage.getItem('dev_refresh_token') : null

    if (devAccess) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${devAccess}`
      if (devRefresh) config.headers['x-refresh-token'] = devRefresh
      return config
    }

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
  } catch (err) {
    // silent
  }
  return config
})

api.interceptors.response.use(
  (resp) => resp,
  (error) => Promise.reject(error)
)