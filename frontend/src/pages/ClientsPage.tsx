const clients = [
  { name: 'Residencial El Poblado', city: 'Medellín', stage: 'Cotización enviada' },
  { name: 'Casa Verde', city: 'Bogotá', stage: 'Levantamiento técnico' },
  { name: 'Torre Arboleda', city: 'Cali', stage: 'Cierre próximo' }
]

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border-default bg-bg-card p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">Clientes</p>
        <h3 className="mt-2 text-2xl font-semibold text-text-primary">Seguimiento comercial y residencial</h3>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {clients.map((client) => (
          <article key={client.name} className="rounded-3xl border border-border-default bg-bg-card p-6">
            <p className="text-lg font-semibold text-text-primary">{client.name}</p>
            <p className="mt-2 text-sm text-text-secondary">{client.city}</p>
            <div className="mt-5 rounded-2xl border border-border-default bg-bg-secondary px-4 py-3 text-sm text-text-primary">
              {client.stage}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
