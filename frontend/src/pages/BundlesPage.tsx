import { useEffect, useState } from 'react'
import { fetchBundles } from '../api/bundles.api'

export default function BundlesPage() {
  const [bundles, setBundles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBundles()
      .then(setBundles)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando paquetes...</p>

  return (
    <div>
      <h1>Paquetes</h1>
      <ul>
        {bundles.map((b: any) => (
          <li key={b.id}>{b.name} — {b.tier}</li>
        ))}
      </ul>
    </div>
  )
}
