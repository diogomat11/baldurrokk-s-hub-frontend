import React from 'react'

type ErrorBoundaryState = {
  hasError: boolean
  error?: Error
  info?: { componentStack: string }
}

type ErrorBoundaryProps = {
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info: { componentStack: info.componentStack } })
    // Log simples no console; em produção, integrar com um serviço de logging
    console.error('ErrorBoundary capturou um erro:', error)
    console.error('Component stack:', info.componentStack)
  }

  handleReload = () => {
    // Forçar recarregamento limpo
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || 'Ocorreu um erro inesperado.'
      const stack = this.state.error?.stack || this.state.info?.componentStack

      return (
        <div className="min-h-screen flex items-center justify-center bg-app p-6">
          <div className="max-w-xl w-full bg-card border border-border rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
            <p className="text-muted-foreground mb-4">
              Encontramos um erro na interface. Você pode tentar recarregar a página.
            </p>

            <div className="mb-4">
              <p className="font-medium">Mensagem:</p>
              <p className="text-sm text-destructive-foreground bg-destructive/10 rounded-xl p-3 mt-2">
                {message}
              </p>
            </div>

            {stack && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-accent">Ver detalhes técnicos</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted rounded-xl p-3 overflow-auto max-h-64">
                  {stack}
                </pre>
              </details>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={this.handleReload}
                className="btn-primary"
              >
                Recarregar página
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, info: undefined })}
                className="btn-secondary"
              >
                Tentar continuar
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}