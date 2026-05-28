import { useEffect, useState } from 'react'
import { fetchProducts } from '../api/products.api'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando productos...</p>

  return (
    <div>
      <h1>Productos</h1>
      <ul>
        {products.map((p: any) => (
          <li key={p.id}>{p.name} — {p.productType}</li>
        ))}
      </ul>
    </div>
  )
}
