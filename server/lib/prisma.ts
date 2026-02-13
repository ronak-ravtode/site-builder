import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const connectionString = `${process.env.DATABASE_URL}`

const normalizedConnectionString = (() => {
  if (!connectionString) return connectionString

  try {
    const url = new URL(connectionString)
    const sslmode = url.searchParams.get('sslmode')

    if (sslmode && ['prefer', 'require', 'verify-ca'].includes(sslmode)) {
      url.searchParams.set('sslmode', 'verify-full')
      return url.toString()
    }

    return connectionString
  } catch {
    return connectionString
  }
})()

const adapter = new PrismaPg({ connectionString: normalizedConnectionString })
const prisma = new PrismaClient({ adapter })

export default prisma