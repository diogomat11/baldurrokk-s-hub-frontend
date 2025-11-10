import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info:
          "border-transparent bg-accent text-accent-foreground hover:bg-accent/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  size?: "sm" | "md" | "lg"
}

function Badge({ className, variant, size = "md", ...props }: BadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  }

  return (
    <div
      className={cn(badgeVariants({ variant }), sizeClasses[size], className)}
      {...props}
    />
  )
}

// Componentes específicos para status
interface StatusBadgeProps {
  status: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className, 
  size = "md" 
}) => {
  const getVariant = (status: string): BadgeProps["variant"] => {
    const statusLower = status.toLowerCase()
    
    // Status positivos
    if (["ativo", "ativa", "pago", "confirmado", "concluído"].includes(statusLower)) {
      return "success"
    }
    
    // Status de alerta
    if (["pendente", "trial", "licença", "processando"].includes(statusLower)) {
      return "warning"
    }
    
    // Status negativos
    if (["inativo", "inativa", "cancelado", "vencido", "expirado", "atrasado"].includes(statusLower)) {
      return "destructive"
    }
    
    // Status informativos
    if (["suspensa", "pausado", "aguardando"].includes(statusLower)) {
      return "info"
    }
    
    return "secondary"
  }

  return (
    <Badge 
      variant={getVariant(status)} 
      size={size}
      className={className}
    >
      {status}
    </Badge>
  )
}

// Componente para badges com ações
interface ActionBadgeProps {
  label: string
  action?: () => void
  variant?: BadgeProps["variant"]
  size?: "sm" | "md" | "lg"
  className?: string
  children?: React.ReactNode
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({
  label,
  action,
  variant = "outline",
  size = "md",
  className,
  children,
}) => {
  return (
    <Badge
      variant={variant}
      size={size}
      className={cn(
        action && "cursor-pointer hover:bg-opacity-80",
        className
      )}
      onClick={action}
    >
      {children || label}
    </Badge>
  )
}

export { Badge, badgeVariants }