import { useState } from 'react'
import { Plus, Trash2, MapPin } from 'lucide-react'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'

interface Room {
  id?: string
  name: string
  floor?: number
  areaSqm?: number
}

interface Step2RoomsProps {
  quoteId: string | null
  rooms: Room[]
  onRoomAdded: (room: Room) => void
  onRoomRemoved: (index: number) => void
}

interface AddRoomFormState {
  name: string
  floor: string
  areaSqm: string
}

export function Step2Rooms({ rooms, onRoomAdded, onRoomRemoved }: Step2RoomsProps) {
  const [form, setForm] = useState<AddRoomFormState>({ name: '', floor: '', areaSqm: '' })
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    if (!form.name.trim()) {
      setError('El nombre del room es requerido')
      return
    }
    setError(null)
    onRoomAdded({
      name: form.name.trim(),
      floor: form.floor ? Number(form.floor) : undefined,
      areaSqm: form.areaSqm ? Number(form.areaSqm) : undefined
    })
    setForm({ name: '', floor: '', areaSqm: '' })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Rooms / Zonas</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Agregá las áreas de la vivienda (habitación, sala, cocina, etc.) donde se instalarán los dispositivos.
        </p>
      </div>

      {/* Add room form */}
      <Card padding="md" className="border-border-default">
        <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Agregar zona
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Nombre (ej: Sala)"
            value={form.name}
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(null) }}
            error={error ?? undefined}
            onKeyDown={handleKeyDown}
          />
          <Input
            placeholder="Piso (ej: 1)"
            type="number"
            value={form.floor}
            onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
            onKeyDown={handleKeyDown}
          />
          <Input
            placeholder="Área m² (ej: 25)"
            type="number"
            value={form.areaSqm}
            onChange={(e) => setForm((f) => ({ ...f, areaSqm: e.target.value }))}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAdd}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Agregar zona
          </Button>
        </div>
      </Card>

      {/* Rooms list */}
      {rooms.length === 0 ? (
        <Card padding="md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="h-10 w-10 text-text-secondary" />
            <p className="mt-3 font-medium text-text-primary">No hay rooms agregados</p>
            <p className="mt-1 text-sm text-text-secondary">
              Agregá al menos una zona para continuar.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {rooms.map((room, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border border-border-default bg-bg-secondary px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/20 text-navy">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{room.name}</p>
                  <p className="text-xs text-text-secondary">
                    {[room.floor !== undefined ? `Piso ${room.floor}` : null, room.areaSqm !== undefined ? `${room.areaSqm} m²` : null].filter(Boolean).join(' · ') || 'Sin dimensiones'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRoomRemoved(index)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-red/10 hover:text-red"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {rooms.length > 0 && (
        <Badge variant="success" size="sm">
          {rooms.length} zona{rooms.length !== 1 ? 's' : ''} definida{rooms.length !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  )
}