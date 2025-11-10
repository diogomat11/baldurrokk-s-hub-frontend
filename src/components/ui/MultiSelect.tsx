import React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export type MultiSelectOption = { label: string; value: string; disabled?: boolean }

interface MultiSelectProps {
  label?: string
  placeholder?: string
  values: string[]
  onChange: (values: string[]) => void
  options: MultiSelectOption[]
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  placeholder = 'Selecione...',
  values,
  onChange,
  options,
  required,
  disabled,
  error,
  className,
}) => {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const triggerId = React.useId()

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return options
    return options.filter((o) => o.label.toLowerCase().includes(term))
  }, [search, options])

  const toggleValue = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val))
    } else {
      onChange([...values, val])
    }
  }

  const clearAll = () => onChange([])
  const selectAllFiltered = () => {
    const ids = filtered.map((o) => o.value)
    const next = Array.from(new Set([...values, ...ids]))
    onChange(next)
  }

  const selectedLabels = React.useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]))
    return values.map((v) => map.get(v) || v)
  }, [values, options])

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label htmlFor={triggerId} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={disabled}
            className={cn(
              'flex min-h-10 w-full items-center justify-between rounded-2xl border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-danger focus:ring-danger'
            )}
          >
            <span className="truncate">
              {selectedLabels.length === 0 && (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              {selectedLabels.length > 0 && (
                <span className="flex flex-wrap gap-1">
                  {selectedLabels.slice(0, 3).map((lbl) => (
                    <Badge key={lbl} variant="outline" size="sm" className="max-w-[10rem] truncate">
                      {lbl}
                    </Badge>
                  ))}
                  {selectedLabels.length > 3 && (
                    <Badge variant="outline" size="sm">+{selectedLabels.length - 3}</Badge>
                  )}
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            className={cn(
              'z-50 w-[var(--radix-popover-trigger-width)] max-w-[28rem] rounded-2xl border border-border bg-popover p-2 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            )}
          >
            <div className="space-y-2">
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAllFiltered} disabled={filtered.length === 0}>Selecionar filtradas</Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  <X className="h-3 w-3 mr-1" /> Limpar
                </Button>
              </div>
              <div className="max-h-60 overflow-auto rounded-xl border border-muted p-1">
                {filtered.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">Nenhuma opção encontrada</div>
                )}
                {filtered.map((opt) => {
                  const checked = values.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent',
                        opt.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        disabled={opt.disabled}
                        checked={checked}
                        onChange={() => toggleValue(opt.value)}
                      />
                      <span className="flex-1 truncate">{opt.label}</span>
                      {checked && <Check className="h-4 w-4 text-primary" />}
                    </label>
                  )
                })}
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!error && (
        <p className="text-xs text-muted-foreground">Selecione múltiplas opções. Use a busca para filtrar.</p>
      )}
    </div>
  )
}

export default MultiSelect