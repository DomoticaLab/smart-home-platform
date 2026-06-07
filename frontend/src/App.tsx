import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const BundlesPage = lazy(() => import('./pages/BundlesPage'))
const ClientsPage = lazy(() => import('./pages/ClientsPage'))
const QuotesPage = lazy(() => import('./pages/QuotesPage'))
const QuoteWizardPage = lazy(() => import('./pages/QuoteWizardPage'))
const QuoteDetailPage = lazy(() => import('./pages/QuoteDetailPage'))

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-primary">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-default bg-bg-card px-6 py-8 shadow-2xl shadow-black/20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <p className="text-sm text-text-secondary">Cargando experiencia domótica...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/bundles" element={<BundlesPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/quotes/new" element={<QuoteWizardPage />} />
          <Route path="/quotes/:id" element={<QuoteDetailPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
