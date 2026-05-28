import { FastifyInstance } from 'fastify'
import {
  getQuotes,
  getQuoteById,
  createQuote
} from '../controllers/quotes.controller'

export default async function quoteRoutes(
  app: FastifyInstance
) {
  app.get('/',    getQuotes)
  app.get('/:id', getQuoteById)
  app.post('/',   createQuote)
}
