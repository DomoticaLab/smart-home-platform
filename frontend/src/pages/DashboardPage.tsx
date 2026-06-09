import { useDashboardStats } from '../hooks/useDashboard'
import type { QuoteStatus } from '../types/product.types'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Colores de la paleta del proyecto para charts
const CHART_COLORS = ['#1A3A5C', '#C9A96E', '#2D7A4F', '#B03030', '#8B949E']

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Borrador',
  REVIEW: 'Revisión',
  FINAL: 'Finalizada',
  APPROVED: 'Aprobada',
  ARCHIVED: 'Archivada'
}

const STATUS_COLORS: Record<QuoteStatus, string> = {
  DRAFT: 'text-text-secondary',
  REVIEW: 'text-gold',
  FINAL: 'text-navy',
  APPROVED: 'text-green',
  ARCHIVED: 'text-text-secondary'
}

// Función helper para formateo COP
function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Skeleton para loading state
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-bg-secondary ${className}`} />
}

// Card KPI
function KpiCard({
  label,
  value,
  tone,
  prefix = ''
}: {
  label: string
  value: string
  tone: string
  prefix?: string
}) {
  return (
    <article className="rounded-3xl border border-border-default bg-bg-card p-5 shadow-xl shadow-black/10">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className={`mt-3 text-4xl font-semibold ${tone}`}>
        {prefix}
        {value}
      </p>
    </article>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardStats()

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg text-red">Error al cargar el dashboard</p>
        <button
          onClick={() => refetch()}
          className="rounded-xl border border-border-default bg-bg-card px-6 py-2 text-sm text-text-primary transition-colors hover:bg-bg-secondary"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Calcular métricas derivadas
  const totalActive = data
    ? Object.values(data.quotesByStatus).reduce((a, b) => a + b, 0)
    : 0

  const quotesThisWeek = data
    ? data.recentQuotes.filter((q) => {
        const d = new Date(q.createdAt)
        const now = new Date()
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 7
      }).length
    : 0

  // Datos para donut chart
  const donutData = data
    ? Object.entries(data.quotesByStatus)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          name: STATUS_LABELS[status as QuoteStatus],
          value: count
        }))
    : []

  // Datos para bar chart (top 5 productos)
  const barData = data
    ? data.topProducts.map((p) => ({
        name: p.product.name.length > 20 ? p.product.name.slice(0, 20) + '…' : p.product.name,
        veces: p.timesQuoted
      }))
    : []

  return (
    <div className="space-y-8">
      {/* Fila 1: KPI cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <KpiCard
              label="Cotizaciones activas"
              value={String(totalActive)}
              tone="text-gold"
            />
            <KpiCard
              label="Valor en pipeline"
              value={formatCOP(data?.totalPipeline ?? 0)}
              tone="text-navy"
            />
            <KpiCard
              label="Valor aprobado"
              value={formatCOP(data?.totalApproved ?? 0)}
              tone="text-green"
            />
            <KpiCard
              label="Esta semana"
              value={String(quotesThisWeek)}
              tone="text-text-primary"
            />
          </>
        )}
      </section>

      {/* Fila 2: Charts */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Donut chart */}
        <article className="rounded-3xl border border-border-default bg-bg-card p-6 shadow-xl shadow-black/10">
          <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">
            Distribución por estado
          </p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">
            Cotizaciones por estado
          </h3>
          {isLoading ? (
            <Skeleton className="mt-6 h-52 w-full" />
          ) : donutData.length === 0 ? (
            <p className="mt-6 text-center text-sm text-text-secondary">
              Sin datos disponibles
            </p>
          ) : (
            <div className="mt-6 flex flex-col items-center">
              <div className="relative h-52 w-52">
                <PieChart width={208} height={208}>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {donutData.map((_, index) => (
                      <cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'cotizaciones']}
                    contentStyle={{
                      backgroundColor: '#1C2333',
                      border: '1px solid #30363D',
                      borderRadius: '12px',
                      color: '#E6EDF3'
                    }}
                  />
                </PieChart>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {donutData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                      }}
                    />
                    <span className="text-xs text-text-secondary">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Bar chart */}
        <article className="rounded-3xl border border-border-default bg-bg-card p-6 shadow-xl shadow-black/10">
          <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">
            Productos
          </p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">
            Más citados en cotizaciones
          </h3>
          {isLoading ? (
            <Skeleton className="mt-6 h-52 w-full" />
          ) : barData.length === 0 ? (
            <p className="mt-6 text-center text-sm text-text-secondary">
              Sin datos disponibles
            </p>
          ) : (
            <div className="mt-6">
              <BarChart width={360} height={208} data={barData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#8B949E', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: '#8B949E', fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} veces`, 'Citado']}
                  contentStyle={{
                    backgroundColor: '#1C2333',
                    border: '1px solid #30363D',
                    borderRadius: '12px',
                    color: '#E6EDF3'
                  }}
                />
                <Bar dataKey="veces" radius={[0, 6, 6, 0]}>
                  {barData.map((_, index) => (
                    <cell
                      key={`bar-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </div>
          )}
        </article>
      </section>

      {/* Fila 3: Tablas */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Cotizaciones recientes */}
        <article className="rounded-3xl border border-border-default bg-bg-card p-6 shadow-xl shadow-black/10">
          <h3 className="text-lg font-semibold text-text-primary">Cotizaciones recientes</h3>
          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : data?.recentQuotes.length === 0 ? (
            <p className="mt-4 text-sm text-text-secondary">Sin cotizaciones recientes</p>
          ) : (
            <div className="mt-4 space-y-2">
              {data?.recentQuotes.map((q) => (
                <a
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border-default bg-bg-secondary px-4 py-3 transition-colors hover:border-gold/40"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-text-primary">
                      {q.quoteNumber}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {q.clientName ?? 'Sin cliente'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status]}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {q.total != null ? formatCOP(q.total) : '-'}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </article>

        {/* Clientes recientes */}
        <article className="rounded-3xl border border-border-default bg-bg-card p-6 shadow-xl shadow-black/10">
          <h3 className="text-lg font-semibold text-text-primary">Clientes recientes</h3>
          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : data?.recentClients.length === 0 ? (
            <p className="mt-4 text-sm text-text-secondary">Sin clientes registrados</p>
          ) : (
            <div className="mt-4 space-y-2">
              {data?.recentClients.map((c) => (
                <a
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border-default bg-bg-secondary px-4 py-3 transition-colors hover:border-gold/40"
                >
                  <div>
                    <p className="font-medium text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-secondary">{c.city ?? 'Sin ciudad'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-primary">
                      {c.quotesCount} cotiz.
                    </p>
                    {c.lastQuoteDate && (
                      <p className="text-xs text-text-secondary">
                        {new Date(c.lastQuoteDate).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}