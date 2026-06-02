const steps = [
  'Datos del cliente',
  'Selección de productos',
  'Resumen económico'
]

export default function QuoteWizardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border-default bg-bg-card p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">Nuevo presupuesto</p>
        <h3 className="mt-2 text-2xl font-semibold text-text-primary">Asistente de cotización guiado</h3>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step} className="rounded-3xl border border-border-default bg-bg-card p-6">
            <p className="text-sm text-gold">Paso {index + 1}</p>
            <p className="mt-3 text-lg font-semibold text-text-primary">{step}</p>
            <p className="mt-2 text-sm text-text-secondary">Bloque editable para completar la cotización.</p>
          </article>
        ))}
      </section>
    </div>
  )
}
