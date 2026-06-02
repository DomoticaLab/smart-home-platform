const bundles = [
  { name: 'Starter Lighting', price: '$1.9M COP', status: 'Listo para vender' },
  { name: 'Security Plus', price: '$4.2M COP', status: 'Alta demanda' },
  { name: 'Full Home Pro', price: '$8.7M COP', status: 'Cotización premium' }
]

export default function BundlesPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border-default bg-bg-card p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">Bundles</p>
        <h3 className="mt-2 text-2xl font-semibold text-text-primary">Paquetes comerciales listos para cotizar</h3>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {bundles.map((bundle) => (
          <article key={bundle.name} className="rounded-3xl border border-border-default bg-bg-card p-6">
            <p className="text-lg font-semibold text-text-primary">{bundle.name}</p>
            <p className="mt-3 text-3xl font-semibold text-gold">{bundle.price}</p>
            <p className="mt-4 inline-flex rounded-full border border-green/30 bg-green/10 px-3 py-1 text-sm text-green">
              {bundle.status}
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}
