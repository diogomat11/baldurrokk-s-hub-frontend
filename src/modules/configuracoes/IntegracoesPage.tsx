import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'

export const IntegracoesPage: React.FC = () => {
  const [whatsappTemplate, setWhatsappTemplate] = React.useState('Olá, sua fatura está disponível. Valor: {{amount}}. Vencimento: {{due_date}}.')
  const [templates, setTemplates] = React.useState<Array<{ id: string; name: string; category: 'Cobrança' | 'Lembrete' | 'Repasse' | 'Informes'; content: string }>>([])
  const [openNew, setOpenNew] = React.useState(false)
  const [newTemplate, setNewTemplate] = React.useState<{ name: string; category: 'Cobrança' | 'Lembrete' | 'Repasse' | 'Informes'; content: string }>({ name: '', category: 'Cobrança', content: '' })
  const [openEdit, setOpenEdit] = React.useState(false)
  const [editTemplate, setEditTemplate] = React.useState<{ id: string; name: string; category: 'Cobrança' | 'Lembrete' | 'Repasse' | 'Informes'; content: string } | null>(null)
  const [banking, setBanking] = React.useState<{ bank_name: string; beneficiary: string; pix_type: string; pix_key: string }>({ bank_name: '', beneficiary: '', pix_type: '', pix_key: '' })
  const [activeTab, setActiveTab] = React.useState<'whatsapp' | 'banking'>('whatsapp')

  const slugify = (s: string) => s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase.from('integrations').select('id, whatsapp_template').eq('id', 'whatsapp').single()
      if (!error && data && (data as any).whatsapp_template) setWhatsappTemplate((data as any).whatsapp_template)
    } catch { /* ignorar em stub */ }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('id, whatsapp_template')
        .ilike('id', 'whatsapp:%')
      if (error) return
      const list = (data || []).map((row: any) => {
        const parts = String(row.id).split(':')
        const name = parts[2] || parts[1] || 'default'
        const categorySlug = parts[1] || 'cobranca'
        const toLabel = (s: string) => {
          if (s === 'cobranca') return 'Cobrança'
          if (s === 'lembrete') return 'Lembrete'
          if (s === 'repasse') return 'Repasse'
          if (s === 'informes') return 'Informes'
          return 'Cobrança'
        }
        return {
          id: String(row.id),
          name: String(name),
          category: toLabel(categorySlug),
          content: String(row.whatsapp_template || ''),
        }
      })
      setTemplates(list)
    } catch { /* ignorar em stub */ }
  }

  const loadBanking = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('id, whatsapp_template')
        .eq('id', 'banking:pix')
        .maybeSingle()
      if (!error && data && (data as any).whatsapp_template) {
        try {
          const json = JSON.parse(String((data as any).whatsapp_template))
          setBanking({
            bank_name: String(json.bank_name || ''),
            beneficiary: String(json.beneficiary || ''),
            pix_type: String(json.pix_type || ''),
            pix_key: String(json.pix_key || ''),
          })
        } catch {}
      }
    } catch {}
  }

  React.useEffect(() => { loadTemplate(); loadTemplates(); loadBanking() }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Abas */}
            <div className="flex gap-2 mb-2">
              <Button variant={activeTab === 'whatsapp' ? 'accent' : 'outline'} onClick={() => setActiveTab('whatsapp')}>WhatsApp</Button>
              <Button variant={activeTab === 'banking' ? 'accent' : 'outline'} onClick={() => setActiveTab('banking')}>Dados bancários</Button>
            </div>
            {activeTab === 'whatsapp' && (
              <>
            {/* Template padrão (rápido) */}
            <div>
              <Input
                type="text"
                label="Template WhatsApp (padrão)"
                placeholder="Mensagem enviada aos alunos"
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
              />
              <p className="text-muted-foreground text-xs mt-1">
                Variáveis suportadas: [responsável], [nomeAluno], [mês], [dataVencimento], [valor], [tipo chave], [chave pix]
              </p>
              <div className="mt-2">
                <Button onClick={async () => {
                  try {
                    const { error } = await supabase.from('integrations').upsert({ id: 'whatsapp', whatsapp_template: whatsappTemplate })
                    if (error) { toast.error('Erro ao salvar integração', { description: error.message }); return }
                    toast.success('Template de WhatsApp salvo')
                    await loadTemplates()
                  } catch (e: any) {
                    toast.info('Salvar integração — implementar backend/configuração persistente')
                  }
                }}>Salvar</Button>
              </div>
            </div>

            {/* Gestão de templates (criar/editar/excluir) */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Templates de WhatsApp</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const tplMens = "Olá [responsável], segue abaixo o valor da mensalidade do aluno(a) [nomeAluno], referente ao mês [mês], com vencimento em [dataVencimento].\nAbaixo, chave PIX para pagamento [tipo chave] - [chave pix]."
                      const tplCobr = "Olá [responsável], segue abaixo o valor da mensalidade do aluno(a) [nomeAluno], referente ao mês [mês], vencido em [dataVencimento].\nAbaixo, chave PIX para pagamento [tipo chave] - [chave pix].\nLembramos que atrasos podem implicar em suspensão das aulas."
                      const tplRep = "Olá [Profissional], segue abaixo o demonstrativo de repasse do mês de [Mês].\nPeço que faça conferência para que possamos efetuar o pagamento.\n[anexo_pdf de Repasse]"
                      const rows = [
                        { id: 'whatsapp:cobranca:mensalidade', whatsapp_template: tplMens },
                        { id: 'whatsapp:cobranca:cobranca', whatsapp_template: tplCobr },
                        { id: 'whatsapp:cobranca:default', whatsapp_template: tplMens },
                        { id: 'whatsapp:repasse:default', whatsapp_template: tplRep },
                      ]
                      for (const r of rows) {
                        const { error } = await supabase.from('integrations').upsert(r)
                        if (error) throw error
                      }
                      toast.success('Templates padrão criados')
                      await loadTemplates()
                    } catch (e: any) {
                      toast.error('Falha ao criar templates padrão', { description: e?.message || String(e) })
                    }
                  }}
                >Semear templates padrão</Button>
              </div>
              <Dialog open={openNew} onOpenChange={setOpenNew}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Novo template</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input type="text" label="Nome" placeholder="ex.: cobranca-1" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                    <div>
                      <label className="text-sm font-medium text-foreground">Categoria</label>
                      <select
                        className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={newTemplate.category}
                        onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                      >
                        <option value="Cobrança">Cobrança</option>
                        <option value="Lembrete">Lembrete</option>
                        <option value="Repasse">Repasse</option>
                        <option value="Informes">Informes</option>
                      </select>
                    </div>
                    <Input type="text" label="Conteúdo" placeholder="Mensagem" value={newTemplate.content} onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })} />
                    <p className="text-xs text-muted-foreground">
                      Variáveis suportadas por categoria: Cobrança/Lembrete: [responsável], [nomeAluno], [mês], [dataVencimento], [valor], opcional [tipo chave], [chave pix]. Repasse: [Profissional], [Mês], [anexo_pdf de Repasse].
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
                    <Button onClick={async () => {
                      try {
                        if (!newTemplate.name || !newTemplate.content) { toast.error('Preencha nome e conteúdo'); return }
                        const categorySlug = slugify(newTemplate.category)
                        const id = `whatsapp:${categorySlug}:${slugify(newTemplate.name)}`
                        const { error } = await supabase.from('integrations').upsert({ id, whatsapp_template: newTemplate.content })
                        if (error) { toast.error('Erro ao salvar', { description: error.message }); return }
                        toast.success('Template criado')
                        setOpenNew(false)
                        setNewTemplate({ name: '', category: 'Cobrança', content: '' })
                        await loadTemplates()
                      } catch (e: any) {
                        toast.info('Salvar integração — backend ausente')
                      }
                    }}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Nome</th>
                    <th className="p-2">Categoria</th>
                    <th className="p-2">Conteúdo</th>
                    <th className="p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(t => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-2">{t.name}</td>
                      <td className="p-2">{t.category}</td>
                      <td className="p-2 truncate max-w-[40ch]" title={t.content}>{t.content}</td>
                      <td className="p-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditTemplate(t); setOpenEdit(true) }}>
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" className="ml-2" onClick={async () => {
                          try {
                            const { error } = await supabase.from('integrations').delete().eq('id', t.id)
                            if (error) { toast.error('Erro ao excluir', { description: error.message }); return }
                            toast.success('Template excluído')
                            await loadTemplates()
                          } catch (e: any) {
                            toast.info('Excluir integração — backend ausente')
                          }
                        }}>
                          <Trash2 className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr>
                      <td className="p-2 text-muted-foreground" colSpan={4}>Nenhum template cadastrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal: editar template */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar template</DialogTitle>
                </DialogHeader>
                {editTemplate && (
                  <div className="space-y-3">
                    <Input type="text" label="Nome" value={editTemplate.name} onChange={(e) => setEditTemplate({ ...editTemplate, name: e.target.value })} />
                    <div>
                      <label className="text-sm font-medium text-foreground">Categoria</label>
                      <select
                        className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={editTemplate.category}
                        onChange={(e) => setEditTemplate(editTemplate ? { ...editTemplate, category: e.target.value as any } : null)}
                      >
                        <option value="Cobrança">Cobrança</option>
                        <option value="Lembrete">Lembrete</option>
                        <option value="Repasse">Repasse</option>
                        <option value="Informes">Informes</option>
                      </select>
                    </div>
                    <Input type="text" label="Conteúdo" value={editTemplate.content} onChange={(e) => setEditTemplate({ ...editTemplate, content: e.target.value })} />
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOpenEdit(false); setEditTemplate(null) }}>Cancelar</Button>
                  <Button onClick={async () => {
                    if (!editTemplate) return
                    try {
                      const categorySlug = slugify(editTemplate.category)
                      const newId = `whatsapp:${categorySlug}:${slugify(editTemplate.name)}`
                      // Se o nome mudar, removemos o antigo e inserimos o novo
                      if (newId !== editTemplate.id) {
                        await supabase.from('integrations').delete().eq('id', editTemplate.id)
                      }
                      const { error } = await supabase.from('integrations').upsert({ id: newId, whatsapp_template: editTemplate.content })
                      if (error) { toast.error('Erro ao salvar', { description: error.message }); return }
                      toast.success('Template atualizado')
                      setOpenEdit(false)
                      setEditTemplate(null)
                      await loadTemplates()
                    } catch (e: any) {
                      toast.info('Salvar integração — backend ausente')
                    }
                  }}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
              </>
            )}
          </div>

          {/* Dados bancários / PIX */}
          {activeTab === 'banking' && (
          <div className="mt-6">
            <h3 className="text-base font-medium mb-2">Dados bancários</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input type="text" label="Banco" placeholder="ex.: Nubank" value={banking.bank_name} onChange={(e) => setBanking({ ...banking, bank_name: e.target.value })} />
              <Input type="text" label="Favorecido" placeholder="Nome do favorecido" value={banking.beneficiary} onChange={(e) => setBanking({ ...banking, beneficiary: e.target.value })} />
              <Input type="text" label="Tipo de chave PIX" placeholder="ex.: CPF, Celular, Aleatória" value={banking.pix_type} onChange={(e) => setBanking({ ...banking, pix_type: e.target.value })} />
              <Input type="text" label="Chave PIX" placeholder="ex.: 000.000.000-00 ou +55 11 99999-0000" value={banking.pix_key} onChange={(e) => setBanking({ ...banking, pix_key: e.target.value })} />
            </div>
            <div className="mt-2">
              <Button onClick={async () => {
                try {
                  const payload = {
                    id: 'banking:pix',
                    whatsapp_template: JSON.stringify({
                      bank_name: banking.bank_name,
                      beneficiary: banking.beneficiary,
                      pix_type: banking.pix_type,
                      pix_key: banking.pix_key,
                    }),
                  }
                  const { error } = await supabase.from('integrations').upsert(payload)
                  if (error) { toast.error('Erro ao salvar dados bancários', { description: error.message }); return }
                  toast.success('Dados bancários salvos')
                } catch (e: any) {
                  toast.info('Salvar integração — backend ausente')
                }
              }}>Salvar</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Esses dados são usados para preencher [tipo chave] e [chave pix] nos templates de cobrança.
            </p>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}