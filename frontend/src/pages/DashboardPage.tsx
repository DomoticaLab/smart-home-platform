const metrics = [
  { label: 'Proyectos activos', value: '12', tone: 'text-gold' },
  { label: 'Dispositivos conectados', value: '148', tone: 'text-text-primary' },
  { label: 'Cotizaciones este mes', value: '34', tone: 'text-green' },
  { label: 'Alertas críticas', value: '2', tone: 'text-red' }
]

const activity = [
  'Nuevo proyecto aprobado para apartamento premium en Medellín.',
  'Sincronización de inventario completada para el catálogo SONOFF.',
  'Cotización #QT-2026-014 enviada a cliente corporativo.',
  'Bundle de iluminación inteligente marcado como recomendado.'
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-3xl border border-border-default bg-bg-card p-5 shadow-xl shadow-black/10"
          >
            <p className="text-sm text-text-secondary">{metric.label}</p>
            <p className={`mt-3 text-4xl font-semibold ${metric.tone}`}>{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-3xl border border-border-default bg-bg-card p-6 shadow-xl shadow-black/10">
          <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">Operación</p>
          <h3 className="mt-2 text-2xl font-semibold text-text-primary">
            Estado general de la plataforma
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {['Ventas', 'Instalación', 'Soporte'].map((label) => (
              <div key={label} className="rounded-2xl border border-border-default bg-bg-secondary p-4">
                <p className="text-sm text-text-secondary">{label}</p>
                <p className="mt-2 text-lg font-semibold text-text-primary">86% estable</p>
                <div className="mt-4 h-2 rounded-full bg-bg-primary">
                  <div className="h-2 w-[86%] rounded-full bg-navy" />
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="rounded-3xl border border-border-default bg-bg-card p-6 shadow-xl shadow-black/10">
          <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">Actividad reciente</p>
          <ul className="mt-5 space-y-4">
            {activity.map((item) => (
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
