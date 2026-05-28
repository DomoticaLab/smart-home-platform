import { useEffect, useState } from 'react'
import { fetchQuotes } from '../api/quotes.api'

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotes()
      .then(setQuotes)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando cotizaciones...</p>

  return (
    <div>
      <h1>Cotizaciones</h1>
      <ul>
        {quotes.map((q: any) => (
          <li key={q.id}>
            {q.quoteNumber} — {q.status}
          </li>
        ))}
      </ul>
    </div>
  )
}
