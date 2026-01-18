import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Globe,
  Building2,
  Users,
  GraduationCap,
  Calendar,
  Wallet,
  FileBarChart,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path?: string
  children?: NavItem[]
  roles?: string[]
}

const navigationItems: NavItem[] = [
  {
    icon: Home,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    icon: Globe,
    label: 'Rede',
    path: '/rede',
  },
  {
    icon: Building2,
    label: 'Unidades',
    path: '/unidades',
  },
  {
    icon: Users,
    label: 'Equipe Técnica',
    path: '/equipe',
  },
  {
    icon: GraduationCap,
    label: 'Alunos',
    path: '/alunos',
  },
  {
    icon: Calendar,
    label: 'Turmas',
    path: '/turmas',
  },
  {
    icon: Wallet,
    label: 'Financeiro',
    children: [
      {
        icon: Wallet,
        label: 'Recebíveis',
        path: '/financeiro/mensalidades',
      },
      {
        icon: Wallet,
        label: 'Despesas',
        path: '/financeiro/despesas',
      },
      {
        icon: Wallet,
        label: 'Repasses',
        path: '/financeiro/repasses',
      },
    ],
    roles: ['Admin', 'Gerente', 'Financeiro'],
  },
  {
    icon: FileBarChart,
    label: 'Relatórios',
    path: '/relatorios',
    roles: ['Admin', 'Gerente'],
  },
  {
    icon: Settings,
    label: 'Configurações',
    children: [
      {
        icon: Settings,
        label: 'Usuários',
        path: '/configuracoes/usuarios',
      },
      {
        icon: Settings,
        label: 'Integrações',
        path: '/configuracoes/integracoes',
      },
    ],
    roles: ['Admin'],
  },
]

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) return saved === 'true'
    return window.innerWidth < 1024 // colapsar em telas menores por padrão
  })
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const location = useLocation()
  const { user, checkRole } = useAuthStore()

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed))
  }, [isCollapsed])

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const filteredNavItems = navigationItems.filter(item =>
    !item.roles || item.roles.some(role => checkRole([role as any]))
  )

  const isActive = (path: string) => {
    return location.pathname === path ||
      (path !== '/dashboard' && location.pathname.startsWith(path))
  }

  const isChildActive = (children?: NavItem[]) => {
    return children?.some(child => child.path && isActive(child.path)) || false
  }

  return (
    <>
      {/* Overlay para mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-primary text-primary-foreground transition-all duration-300 ease-in-out lg:sticky lg:top-0",
          isCollapsed ? "-translate-x-full lg:w-16" : "translate-x-0 lg:w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-center p-4 border-b border-primary-foreground/10">
            <div className="flex items-center space-x-4">
              <img
                src="/coelho-logo.webp"
                alt="Coelho Futebol e Futsal"
                className="h-16 w-16 rounded-2xl shadow-lg"
              />
              {!isCollapsed && (
                <div>
                  <h1 className="text-2xl font-bold">Coelho Futebol e Futsal</h1>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-primary-foreground/10 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-3">
              {filteredNavItems.map((item) => (
                <li key={item.label}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(item.label)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                          "hover:bg-primary-foreground/10",
                          (isChildActive(item.children) || expandedItems.includes(item.label)) &&
                          "bg-primary-foreground/20"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-5 w-5" />
                          {!isCollapsed && <span>{item.label}</span>}
                        </div>
                        {!isCollapsed && (
                          <div className="flex-shrink-0">
                            {expandedItems.includes(item.label) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </button>

                      {/* Children */}
                      {!isCollapsed && expandedItems.includes(item.label) && (
                        <ul className="mt-2 space-y-1 pl-8">
                          {item.children.map((child) => (
                            <li key={child.label}>
                              <Link
                                to={child.path!}
                                className={cn(
                                  "block px-3 py-2 rounded-lg text-sm transition-colors",
                                  "hover:bg-primary-foreground/10",
                                  isActive(child.path!) && "bg-primary-foreground/20 text-white"
                                )}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path!}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                        "hover:bg-primary-foreground/10",
                        isActive(item.path!) && "bg-primary-foreground/20 text-white"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* User info */}
          {!isCollapsed && user && (
            <div className="p-4 border-t border-primary-foreground/10">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-sm font-medium text-accent-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-primary-foreground/70 truncate">{user.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Toggle button para desktop */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "hidden lg:block fixed top-4 left-4 z-[60] p-2 rounded-xl bg-primary text-primary-foreground shadow-lg transition-all duration-300 lg:left-[calc(16rem+2rem)]",
          isCollapsed && "lg:left-[calc(4rem+2rem)]"
        )}
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  )
}