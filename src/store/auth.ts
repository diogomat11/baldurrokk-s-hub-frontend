import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/services/supabase/client'
import { api } from '@/services/api'
import type { User, AuthState, UserRole } from '@/types'
import { toast } from 'sonner'

interface AuthStore extends AuthState {
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<boolean>
  refreshToken: () => Promise<boolean>
  updateProfile: (updates: Partial<User>) => Promise<boolean>
  checkRole: (allowedRoles: UserRole[]) => boolean
}

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutos antes da expiração

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true })

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            // Fallback de desenvolvimento: tentar login via backend
            try {
              const resp = await api.post('/auth/login', { email, password })
              const { access_token, refresh_token, user: backendUser } = resp.data || {}

              if (access_token) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('dev_access_token', access_token)
                  if (refresh_token) localStorage.setItem('dev_refresh_token', String(refresh_token))
                }

                const user: User = {
                  id: backendUser?.id || 'dev-user',
                  email: backendUser?.email || email,
                  name: backendUser?.name || 'Usuário Dev',
                  role: (backendUser?.role || 'Admin') as UserRole,
                  avatar: backendUser?.avatar_url,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }

                set({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                })

                toast.success('Login realizado com sucesso! (modo desenvolvimento)')
                return true
              }
            } catch (devErr) {
              console.error('Fallback de login (dev) falhou:', devErr)
            }

            toast.error('Erro ao fazer login', {
              description: error.message,
            })
            set({ isLoading: false })
            return false
          }

          if (data.user) {
            // Buscar dados adicionais do usuário
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (userError) {
              console.error('Erro ao buscar dados do usuário:', userError)
            }

            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: userData?.name || data.user.user_metadata?.name || '',
              role: (userData?.role || 'Aluno') as UserRole,
              avatar: userData?.avatar_url || data.user.user_metadata?.avatar_url,
              created_at: data.user.created_at,
              updated_at: userData?.updated_at || data.user.created_at,
            }

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            })

            toast.success('Login realizado com sucesso!')
            
            // Verificar se precisa de refresh token
            if (data.session?.expires_at) {
              const expiresAt = data.session.expires_at * 1000
              const now = Date.now()
              const timeUntilExpiry = expiresAt - now
              
              if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
                // Agendar refresh automático
                setTimeout(() => {
                  get().refreshToken()
                }, Math.max(timeUntilExpiry - TOKEN_REFRESH_THRESHOLD, 0))
              }
            }

            return true
          }

          return false
        } catch (error) {
          console.error('Erro no signIn:', error)
          toast.error('Erro inesperado ao fazer login')
          set({ isLoading: false })
          return false
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut()
          // Limpar tokens de desenvolvimento, se existirem
          if (typeof window !== 'undefined') {
            localStorage.removeItem('dev_access_token')
            localStorage.removeItem('dev_refresh_token')
          }
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
          toast.success('Logout realizado com sucesso!')
        } catch (error) {
          console.error('Erro no signOut:', error)
          toast.error('Erro ao fazer logout')
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true })

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          })

          if (error) {
            toast.error('Erro ao criar conta', {
              description: error.message,
            })
            set({ isLoading: false })
            return false
          }

          if (data.user) {
            // Criar registro na tabela users
            const { error: userError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                name,
                email,
                role: 'Aluno',
              })

            if (userError) {
              console.error('Erro ao criar usuário na tabela:', userError)
            }

            toast.success('Conta criada com sucesso! Verifique seu email para confirmar.')
            set({ isLoading: false })
            return true
          }

          return false
        } catch (error) {
          console.error('Erro no signUp:', error)
          toast.error('Erro inesperado ao criar conta')
          set({ isLoading: false })
          return false
        }
      },

      refreshToken: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession()

          if (error) {
            console.error('Erro ao renovar token:', error)
            // Se erro de refresh, fazer logout
            get().signOut()
            return false
          }

          if (data.user && data.session) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single()

            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: userData?.name || data.user.user_metadata?.name || '',
              role: (userData?.role || 'Aluno') as UserRole,
              avatar: userData?.avatar_url || data.user.user_metadata?.avatar_url,
              created_at: data.user.created_at,
              updated_at: userData?.updated_at || data.user.created_at,
            }

            set({
              user,
              isAuthenticated: true,
            })

            // Agendar próximo refresh
            if (data.session.expires_at) {
              const expiresAt = data.session.expires_at * 1000
              const now = Date.now()
              const timeUntilExpiry = expiresAt - now
              
              setTimeout(() => {
                get().refreshToken()
              }, Math.max(timeUntilExpiry - TOKEN_REFRESH_THRESHOLD, 0))
            }

            return true
          }

          return false
        } catch (error) {
          console.error('Erro no refreshToken:', error)
          return false
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        try {
          const { user } = get()
          if (!user) return false

          const { error } = await supabase
            .from('users')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

          if (error) {
            toast.error('Erro ao atualizar perfil', {
              description: error.message,
            })
            return false
          }

          // Atualizar estado local
          set({
            user: {
              ...user,
              ...updates,
            },
          })

          toast.success('Perfil atualizado com sucesso!')
          return true
        } catch (error) {
          console.error('Erro no updateProfile:', error)
          toast.error('Erro inesperado ao atualizar perfil')
          return false
        }
      },

      checkRole: (allowedRoles: UserRole[]) => {
        const { user } = get()
        return user ? allowedRoles.includes(user.role) : false
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Verificar sessão atual na inicialização
const initializeAuth = async () => {
  try {
    // Fallback de desenvolvimento: se houver token dev no localStorage, recuperar usuário via backend
    const devAccess = typeof window !== 'undefined' ? localStorage.getItem('dev_access_token') : null
    if (devAccess) {
      try {
        const { data: me } = await api.get('/users/me')
        const user: User = {
          id: me?.id || 'dev-user',
          email: me?.email || '',
          name: me?.name || 'Usuário Dev',
          role: (me?.role || 'Admin') as UserRole,
          avatar: me?.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        useAuthStore.setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
        return
      } catch (e) {
        // Se falhar, limpar tokens dev e seguir fluxo padrão
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dev_access_token')
          localStorage.removeItem('dev_refresh_token')
        }
      }
    }

    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userData) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: userData.name || session.user.user_metadata?.name || '',
          role: (userData.role || 'Aluno') as UserRole,
          avatar: userData.avatar_url || session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
          updated_at: userData.updated_at || session.user.created_at,
        }

        useAuthStore.setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } else {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  } catch (error) {
    console.error('Erro ao inicializar autenticação:', error)
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }
}

// Auto-logout após inatividade
let inactivityTimer: NodeJS.Timeout | null = null

const resetInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }
  
  const { isAuthenticated } = useAuthStore.getState()
  
  if (isAuthenticated) {
    inactivityTimer = setTimeout(() => {
      useAuthStore.getState().signOut()
      toast.info('Sessão expirada por inatividade')
    }, 20 * 60 * 1000) // 20 minutos conforme especificação
  }
}

// Event listeners para detectar atividade do usuário
if (typeof window !== 'undefined') {
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true)
  })
  
  resetInactivityTimer()
}

// Inicializar verificação de autenticação
initializeAuth()