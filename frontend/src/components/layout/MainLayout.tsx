import {
  Boxes,
  LayoutDashboard,
  ReceiptText,
  ServerCog,
  ShoppingBag,
  Users,
  WandSparkles
} from 'lucide-react'
import { NavLink, Outlet, matchPath, useLocation } from 'react-router-dom'

type NavigationItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

const navigationItems: NavigationItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Productos', icon: ShoppingBag },
  { to: '/bundles', label: 'Bundles', icon: Boxes },
  { to: '/clients', label: 'Clientes', icon: Users },
  { to: '/quotes', label: 'Cotizaciones', icon: ReceiptText },
  { to: '/quotes/new', label: 'Nuevo presupuesto', icon: WandSparkles }
]

function getPageTitle(pathname: string): string {
  if (matchPath('/quotes/new', pathname)) {
    return 'Nuevo presupuesto'
  }

  if (matchPath('/quotes/:id', pathname)) {
    return 'Detalle de presupuesto'
  }

  const item = navigationItems.find((entry) => entry.to === pathname)
  if (item) {
    return item.label
  }

  return 'Dashboard'
}

export function MainLayout() {
  const location = useLocation()
  const activeTitle = getPageTitle(location.pathname)

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary md:pl-[240px]">
      <aside className="border-b border-border-default bg-bg-secondary/95 px-5 py-6 backdrop-blur md:fixed md:inset-y-0 md:left-0 md:flex md:w-[240px] md:flex-col md:border-b-0 md:border-r">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold shadow-lg shadow-black/20">
            <ServerCog className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-text-secondary">
              Domotica
            </p>
            <h1 className="text-lg font-semibold text-text-primary">Control Hub</h1>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'border-gold/40 bg-gold/10 text-text-primary shadow-lg shadow-black/10'
                      : 'border-transparent text-text-secondary hover:border-border-default hover:bg-bg-card/60 hover:text-text-primary'
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-border-default bg-bg-card px-4 py-4 text-sm text-text-secondary shadow-xl shadow-black/10">
          <p className="mb-1 text-xs uppercase tracking-[0.24em] text-gold">Sistema</p>
          <p className="font-medium text-text-primary">Versión 0.1.0</p>
          <p>Infraestructura local para domótica residencial.</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-border-default bg-bg-primary/90 px-6 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">Panel</p>
              <h2 className="text-2xl font-semibold text-text-primary">{activeTitle}</h2>
            </div>
            <div className="hidden rounded-full border border-green/30 bg-green/10 px-3 py-1 text-sm text-green sm:block">
              En línea
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
