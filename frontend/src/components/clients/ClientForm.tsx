import { useState } from 'react'
import type { CreateClientFormData, UpdateClientFormData } from '../../types/client.types'
import { CreateClientSchema } from '../../types/client.types'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

type FormMode = 'create' | 'edit'

interface ClientFormProps {
  mode: FormMode
  initialData?: Partial<CreateClientFormData>
  onSubmit: (data: CreateClientFormData | UpdateClientFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

type FieldErrors = Partial<Record<keyof CreateClientFormData, string>>

export function ClientForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: ClientFormProps) {
  const [values, setValues] = useState<CreateClientFormData>(() => ({
    name: initialData?.name ?? '',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
    city: initialData?.city ?? '',
    notes: initialData?.notes ?? ''
  }))

  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (field: keyof CreateClientFormData, rawValue: string) => {
    setValues((prev) => ({ ...prev, [field]: rawValue }))
    // Limpiar error del campo cuando el usuario edita
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Validar con Zod
    const result = CreateClientSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof FieldErrors
        if (path && !(path in fieldErrors)) {
          fieldErrors[path] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    try {
      await onSubmit(result.data)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const isValid = values.name.trim().length >= 2

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Nombre completo"
        placeholder="Ej: Juan Pérez"
        value={values.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        required
        autoFocus
      />

      <Input
        label="Teléfono"
        placeholder="+573001234567 o 3001234567"
        value={values.phone ?? ''}
        onChange={(e) => handleChange('phone', e.target.value)}
        error={errors.phone}
        hint="Formato colombiano: +57XXXXXXXXXX o 3XXXXXXXXX"
      />

      <Input
        label="Email"
        type="email"
        placeholder="juan@example.com"
        value={values.email ?? ''}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
      />

      <Input
        label="Ciudad"
        placeholder="Bogotá"
        value={values.city ?? ''}
        onChange={(e) => handleChange('city', e.target.value)}
        error={errors.city}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">
          Notas <span className="text-text-secondary text-xs">(opcional)</span>
        </label>
        <textarea
          placeholder="Notas sobre el cliente, preferencias, observaciones..."
          value={values.notes ?? ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          className={[
            'w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-secondary/60',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50',
            'resize-none',
            errors.notes
              ? 'border-red/60 focus:ring-red/30'
              : 'border-border-default hover:border-text-secondary/40'
          ].join(' ')}
        />
        {errors.notes && (
          <p className="text-xs text-red">{errors.notes}</p>
        )}
      </div>

      {submitError && (
        <div className="rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm text-red">
          {submitError}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={!isValid}
        >
          {mode === 'create' ? 'Crear cliente' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}