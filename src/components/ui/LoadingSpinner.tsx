import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  text?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center space-y-2">
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-muted border-t-primary",
            sizeClasses[size]
          )}
        />
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  )
}

export { LoadingSpinner }

// Componente para loading de página completa
export const PageLoading: React.FC<{ text?: string }> = ({ text = "Carregando..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-app">
    <LoadingSpinner size="lg" text={text} />
  </div>
)

// Componente para loading inline
export const InlineLoading: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center justify-center p-4">
    <LoadingSpinner size="md" text={text} />
  </div>
)

// Componente para loading de botões
export const ButtonLoading: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
    <span>Carregando...</span>
  </div>
)