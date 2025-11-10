import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronDown
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth'
import { debounce } from '@/lib/utils'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  time: string
  read: boolean
}

export const Topbar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()

  // Mock de notificações - em uma aplicação real, isso viria de uma API
  const notifications: NotificationItem[] = [
    {
      id: '1',
      title: 'Nova mensalidade gerada',
      message: 'Fatura do aluno João Silva está disponível',
      type: 'info',
      time: '5 min',
      read: false,
    },
    {
      id: '2',
      title: 'Pagamento confirmado',
      message: 'Maria Santos pagou a mensalidade de novembro',
      type: 'success',
      time: '1 hora',
      read: false,
    },
    {
      id: '3',
      title: 'Fatura vencida',
      message: '3 faturas venceram hoje',
      type: 'warning',
      time: '2 horas',
      read: true,
    },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  const handleSearch = debounce((term: string) => {
    if (term.trim()) {
      // Implementar lógica de busca
      console.log('Searching for:', term)
    }
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    handleSearch(value)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleNotificationClick = (notification: NotificationItem) => {
    // Marcar como lida e executar ação
    console.log('Notification clicked:', notification)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'warning':
        return '⚠'
      case 'error':
        return '✕'
      default:
        return 'i'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-success'
      case 'warning':
        return 'text-warning'
      case 'error':
        return 'text-danger'
      default:
        return 'text-accent'
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border backdrop-blur-sm bg-card/95">
      <div className="flex items-center justify-between p-4">
        {/* Branding à esquerda */}
        <div className="flex items-center space-x-3 mr-4">
          <img src="/coelho-logo.webp" alt="Coelho Futebol e Futsal" className="h-10 w-10 rounded-2xl shadow" />
          <span className="hidden md:block text-lg font-bold">Coelho Futebol e Futsal</span>
        </div>
        {/* Campo de busca */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar alunos, unidades, faturas..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Ações do lado direito */}
        <div className="flex items-center space-x-4">
          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  size="sm"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </button>

            {/* Dropdown de notificações */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-lg z-50">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-border last:border-b-0 hover:bg-muted cursor-pointer ${
                          !notification.read ? 'bg-muted/50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <button className="text-sm text-accent hover:underline">
                      Marcar todas como lidas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Menu do usuário */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <Avatar className="h-8 w-8">
                {user?.avatar ? (
                  <AvatarImage src={user.avatar} alt={user?.name || 'Usuário'} />
                ) : (
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* Dropdown do usuário */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-lg z-50">
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate('/configuracoes')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/configuracoes')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </button>
                  
                  <div className="border-t border-border my-1" />
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left text-danger"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}