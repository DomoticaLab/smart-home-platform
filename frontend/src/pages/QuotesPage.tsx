const statuses = [
  { label: 'Borradores', value: '08', tone: 'text-text-primary' },
  { label: 'En revisión', value: '14', tone: 'text-gold' },
  { label: 'Aprobadas', value: '06', tone: 'text-green' }
]

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {statuses.map((status) => (
          <article key={status.label} className="rounded-3xl border border-border-default bg-bg-card p-6">
            <p className="text-sm text-text-secondary">{status.label}</p>
            <p className={`mt-3 text-4xl font-semibold ${status.tone}`}>{status.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-border-default bg-bg-card p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">Cotizaciones</p>
        <h3 className="mt-2 text-2xl font-semibold text-text-primary">Pipeline comercial de presupuestos</h3>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border-default">
          <div className="grid grid-cols-3 bg-bg-secondary px-4 py-3 text-sm text-text-secondary">
            <span>Referencia</span>
            <span>Cliente</span>
            <span>Estado</span>
          </div>
          {[
            ['QT-2026-014', 'Residencial El Poblado', 'En revisión'],
            ['QT-2026-015', 'Casa Verde', 'Aprobada'],
            ['QT-2026-016', 'Torre Arboleda', 'Borrador']
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-3 border-t border-border-default px-4 py-4 text-sm text-text-primary">
              <span>{row[0]}</span>
              <span>{row[1]}</span>
              <span>{row[2]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
