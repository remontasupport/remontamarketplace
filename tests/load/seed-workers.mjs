/**
 * Seeds 10 test worker accounts for k6 signin load tests.
 *
 * Run:   node tests/load/seed-workers.mjs
 * Clean: node tests/load/seed-workers.mjs --delete
 */

import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PASSWORD = 'K6Worker123!'
const EMAILS = Array.from({ length: 10 }, (_, i) => `k6worker_${i + 1}@test-remonta.com`)

async function seed() {
  const hash = await bcrypt.hash(PASSWORD, 12)
  let created = 0

  for (const email of EMAILS) {
    try {
      await prisma.user.create({
        data: {
          email,
          passwordHash: hash,
          role: 'WORKER',
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      })
      created++
      console.log(`Created: ${email}`)
    } catch (err) {
      if (err.code === 'P2002') {
        console.log(`Already exists: ${email}`)
      } else {
        console.error(`Failed: ${email}`, err.message)
      }
    }
  }

  console.log(`\nDone. Created ${created} accounts. Password: ${PASSWORD}`)
  console.log('Cleanup: node tests/load/seed-workers.mjs --delete')
}

async function cleanup() {
  const { count } = await prisma.user.deleteMany({
    where: { email: { in: EMAILS } },
  })
  console.log(`Deleted ${count} test worker accounts.`)
}

const isDelete = process.argv.includes('--delete')
isDelete ? cleanup().finally(() => prisma.$disconnect()) : seed().finally(() => prisma.$disconnect())
