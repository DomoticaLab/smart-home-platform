const BASE = import.meta.env.VITE_API_URL
  || 'http://localhost:3000'

export async function fetchProducts() {
  const res = await fetch(`${BASE}/api/products`)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

export async function fetchProductBySlug(slug: string) {
  const res = await fetch(`${BASE}/api/products/${slug}`)
  if (!res.ok) throw new Error('Product not found')
  return res.json()
}
