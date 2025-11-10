import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Modal'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { api } from '@/services/api'

type UserItem = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Gerente' | 'Financeiro' | 'Equipe' | 'Aluno'
  status: 'Ativo' | 'Inativo'
}

export const UsuariosPage: React.FC = () => {
  const [users, setUsers] = React.useState<UserItem[]>([])
  const [search, setSearch] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [openNew, setOpenNew] = React.useState(false)
  const [newUser, setNewUser] = React.useState<{ name: string; email: string; role: UserItem['role']; status: UserItem['status'] }>({
    name: '',
    email: '',
    role: 'Aluno',
    status: 'Ativo',
  })
  const [openEdit, setOpenEdit] = React.useState(false)
  const [editUser, setEditUser] = React.useState<UserItem | null>(null)
  const [hideInactive, setHideInactive] = React.useState(true)

  const filtered = React.useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      const passesStatus = hideInactive ? u.status !== 'Inativo' : true
      return matchesSearch && passesStatus
    })
  }, [users, search, hideInactive])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from('users').select('id,name,email,role,status')
      if (error) {
        toast.error('Erro ao carregar usuários', { description: error.message })
        return
      }
      setUsers((data || []) as any)
    } finally {
      setIsLoading(false)
    }
  }

  // Removido botão de "Manter Diogo..." conforme solicitação

  const handleUpdate = async (id: string, patch: Partial<UserItem>) => {
    try {
      const { error } = await supabase.from('users').update(patch).eq('id', id)
      if (error) {
        toast.error('Erro ao atualizar usuário', { description: error.message })
        return
      }
      toast.success('Usuário atualizado')
      await loadUsers()
    } catch (e: any) {
      toast.error('Falha ao salvar', { description: e?.message || String(e) })
    }
  }

  React.useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              type="text"
              label="Buscar"
              placeholder="Nome ou email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-end gap-2">
              <Dialog open={openNew} onOpenChange={setOpenNew}>
                <DialogTrigger asChild>
                  <Button className="w-full"><Plus className="h-4 w-4 mr-2" />Novo usuário</Button>
                </DialogTrigger>
                <DialogContent size="lg">
                  <DialogHeader>
                    <DialogTitle>Convidar usuário</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input type="text" label="Nome" placeholder="Ex.: João Silva" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                    <Input type="email" label="Email" placeholder="Ex.: joao@email.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as UserItem['role'] })}>
                      <SelectTrigger label="Papel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Gerente">Gerente</SelectItem>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                        <SelectItem value="Equipe">Equipe</SelectItem>
                        <SelectItem value="Aluno">Aluno</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newUser.status} onValueChange={(v) => setNewUser({ ...newUser, status: v as UserItem['status'] })}>
                      <SelectTrigger label="Status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
                    <Button onClick={async () => {
                      try {
                        if (!newUser.name || !newUser.email) {
                          toast.error('Preencha nome e email')
                          return
                        }
                        // Convite de usuário via backend (apenas Admin)
                        const { data } = await api.post('/auth/invite', {
                          email: newUser.email,
                          name: newUser.name,
                          role: newUser.role,
                          status: newUser.status,
                        })
                        if (!data || !data.id) {
                          toast.error('Erro ao convidar usuário', { description: 'Resposta inesperada do servidor' })
                          return
                        }
                        toast.success('Convite enviado com sucesso')
                        setOpenNew(false)
                        setNewUser({ name: '', email: '', role: 'Aluno', status: 'Ativo' })
                        await loadUsers()
                      } catch (e: any) {
                        const msg = e?.response?.data?.error || e?.message || String(e)
                        toast.error('Falha ao convidar usuário', { description: msg })
                      }
                    }}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={hideInactive} onChange={(e) => setHideInactive(e.target.checked)} />
                Ocultar inativos
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Nome</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Papel</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">
                      <Select value={u.role} onValueChange={(v) => handleUpdate(u.id, { role: v as UserItem['role'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Gerente">Gerente</SelectItem>
                          <SelectItem value="Financeiro">Financeiro</SelectItem>
                          <SelectItem value="Equipe">Equipe</SelectItem>
                          <SelectItem value="Aluno">Aluno</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select value={u.status} onValueChange={(v) => handleUpdate(u.id, { status: v as UserItem['status'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditUser(u); setOpenEdit(true) }}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-2 text-muted-foreground" colSpan={4}>
                      {isLoading ? 'Carregando…' : 'Nenhum usuário encontrado'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal: Editar usuário */}
          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>Editar usuário</DialogTitle>
              </DialogHeader>
              {editUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input type="text" label="Nome" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} />
                  <Input type="email" label="Email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} />
                  <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v as UserItem['role'] })}>
                    <SelectTrigger label="Papel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Equipe">Equipe</SelectItem>
                      <SelectItem value="Aluno">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={editUser.status} onValueChange={(v) => setEditUser({ ...editUser, status: v as UserItem['status'] })}>
                    <SelectTrigger label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpenEdit(false); setEditUser(null) }}>Cancelar</Button>
                <Button onClick={async () => {
                  if (!editUser) return
                  try {
                    const { error } = await supabase.from('users').update({
                      name: editUser.name,
                      email: editUser.email,
                      role: editUser.role,
                      status: editUser.status,
                    }).eq('id', editUser.id)
                    if (error) { toast.error('Erro ao atualizar usuário', { description: error.message }); return }
                    toast.success('Usuário atualizado')
                    setOpenEdit(false)
                    setEditUser(null)
                    await loadUsers()
                  } catch (e: any) {
                    toast.error('Falha ao salvar', { description: e?.message || String(e) })
                  }
                }}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}