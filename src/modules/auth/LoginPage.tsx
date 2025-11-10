import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { signIn, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const success = await signIn(data.email, data.password)
      
      if (success) {
        navigate('/dashboard')
      } else {
        setError('root', {
          message: 'Email ou senha incorretos',
        })
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setError('root', {
        message: 'Erro inesperado. Tente novamente.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Entrar na sua conta
        </h2>
        <p className="text-muted-foreground">
          Sistema de gestão completo para escolinhas de futebol e futsal
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          required
          {...register('email')}
          disabled={isLoading}
        />

        <Input
          type="password"
          label="Senha"
          placeholder="••••••••"
          error={errors.password?.message}
          required
          {...register('password')}
          disabled={isLoading}
        />

        {errors.root?.message && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20">
            <p className="text-sm text-danger">{errors.root.message}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || isSubmitting}
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              <span>Entrando...</span>
            </div>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          className="text-sm text-accent hover:underline"
          onClick={() => toast.info('Função em desenvolvimento')}
        >
          Esqueceu sua senha?
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Ou
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => toast.info('Função em desenvolvimento')}
          >
            Criar conta
          </button>
        </p>
      </div>

      {/* Bloco de demonstração removido conforme solicitação */}
    </div>
  )
}