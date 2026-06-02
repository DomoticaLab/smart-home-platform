import { useParams } from 'react-router-dom'

const timeline = [
  'Cotización generada por el equipo comercial.',
  'Productos compatibles validados contra el schema.',
  'Ajustes finales pendientes de aprobación.'
]

export default function QuoteDetailPage() {
  const params = useParams()

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border-default bg-bg-card p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">Detalle de presupuesto</p>
        <h3 className="mt-2 text-2xl font-semibold text-text-primary">Cotización {params.id ?? 'sin referencia'}</h3>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-border-default bg-bg-card p-6">
          <p className="text-lg font-semibold text-text-primary">Resumen económico</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['Subtotal', '$18.400.000'],
              ['Instalación', '$2.900.000'],
              ['Total', '$21.300.000']
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border-default bg-bg-secondary p-4">
                <p className="text-sm text-text-secondary">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="rounded-3xl border border-border-default bg-bg-card p-6">
          <p className="text-lg font-semibold text-text-primary">Línea de tiempo</p>
          <ul className="mt-5 space-y-3">
            {timeline.map((item) => (
              <li key={item} className="rounded-2xl border border-border-default bg-bg-secondary p-4 text-sm text-text-primary">
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  )
}
