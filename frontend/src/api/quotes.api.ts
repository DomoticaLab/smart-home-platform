const BASE = import.meta.env.VITE_API_URL
  || 'http://localhost:3000'

export async function fetchQuotes() {
  const res = await fetch(`${BASE}/api/quotes`)
  if (!res.ok) throw new Error('Failed to fetch quotes')
  return res.json()
}

export async function fetchQuoteById(id: string) {
  const res = await fetch(`${BASE}/api/quotes/${id}`)
  if (!res.ok) throw new Error('Quote not found')
  return res.json()
}

export async function createQuote(data: object) {
  const res = await fetch(`${BASE}/api/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create quote')
  return res.json()
}
