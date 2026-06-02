const productHighlights = [
  { label: 'Productos activos', value: '63' },
  { label: 'Familias', value: '8' },
  { label: 'Stock bajo', value: '7' }
]

const segments = ['Switches', 'Sensores', 'Cámaras', 'Hubs', 'Energía']

export default function ProductsPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        {productHighlights.map((item) => (
          <article key={item.label} className="rounded-3xl border border-border-default bg-bg-card p-5">
            <p className="text-sm text-text-secondary">{item.label}</p>
            <p className="mt-3 text-4xl font-semibold text-text-primary">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-border-default bg-bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">Catálogo</p>
            <h3 className="mt-2 text-2xl font-semibold text-text-primary">Segmentación de productos</h3>
          </div>
          <div className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold">
            Tailored for LATAM
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {segments.map((segment) => (
            <div key={segment} className="rounded-2xl border border-border-default bg-bg-secondary p-4 text-center">
              <p className="font-medium text-text-primary">{segment}</p>
              <p className="mt-2 text-sm text-text-secondary">Compatibilidad validada</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
