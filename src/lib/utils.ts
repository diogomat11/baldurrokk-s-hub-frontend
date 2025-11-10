import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar valores monetários
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Função para formatar CPF
export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// Função para formatar telefone
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

// Função para formatar CEP
export function formatCEP(cep: string): string {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2')
}

// Função para formatar datas
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

// Função para calcular idade
export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// Função para gerar iniciais do nome
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

// Função para obter cor baseada no status
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Status de unidade
    'Ativa': 'text-success bg-success/10',
    'Inativa': 'text-danger bg-danger/10',
    
    // Status de profissional
    'Ativo': 'text-success bg-success/10',
    'Licença': 'text-warning bg-warning/10',
    'Inativo': 'text-danger bg-danger/10',
    
    // Status de aluno
    'Trial': 'text-accent bg-accent/10',
    
    // Status financeiro
    'Pendente': 'text-warning bg-warning/10',
    'Pago': 'text-success bg-success/10',
    'Vencido': 'text-danger bg-danger/10',
    'Cancelado': 'text-muted-foreground bg-muted/10',
    'Atrasado': 'text-danger bg-danger/10',
  }
  
  return statusColors[status] || 'text-foreground bg-muted/10'
}

// Função para slugify
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Função para debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Função para validar CPF
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/[^\d]/g, '')
  
  if (cleaned.length !== 11) return false
  
  if (/^(\d)\1{10}$/.test(cleaned)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cleaned.charAt(10))
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para máscaras
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function maskCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d{0,3})/, '$1.$2')
  if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4')
}

export function maskCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length <= 5) return cleaned
  return cleaned.replace(/(\d{5})(\d{0,3})/, '$1-$2')
}

export function maskCurrency(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  const numericValue = parseFloat(cleaned) / 100
  
  if (isNaN(numericValue)) return ''
  
  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}