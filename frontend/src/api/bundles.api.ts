const BASE = import.meta.env.VITE_API_URL
  || 'http://localhost:3000'

export async function fetchBundles() {
  const res = await fetch(`${BASE}/api/bundles`)
  if (!res.ok) throw new Error('Failed to fetch bundles')
  return res.json()
}

export async function fetchBundleBySlug(slug: string) {
  const res = await fetch(`${BASE}/api/bundles/${slug}`)
  if (!res.ok) throw new Error('Bundle not found')
  return res.json()
}
