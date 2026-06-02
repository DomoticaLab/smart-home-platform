import { buildApp } from './app'
import { config } from './lib/config'
import { prisma } from './lib/prisma'

async function start() {
  const app = buildApp()

  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, 'Shutting down application')
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' })
  } catch (error) {
    app.log.error(error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

start()
