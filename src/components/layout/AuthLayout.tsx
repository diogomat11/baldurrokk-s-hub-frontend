import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/coelho-logo.webp" 
              alt="Coelho Futebol e Futsal" 
              className="h-32 w-32 rounded-2xl shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Coelho Futebol e Futsal
          </h1>
          <p className="text-primary-100 text-sm">
            Sistema de gestão completo para escolinhas de futebol e futsal
          </p>
        </div>

        {/* Card do formulário */}
        <div className="bg-card rounded-2xl shadow-xl p-8">
          {children}
        </div>

        {/* Rodapé */}
        <div className="text-center mt-8">
          <p className="text-primary-200 text-sm">
            © {new Date().getFullYear()} Baldurrokk Hub. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}