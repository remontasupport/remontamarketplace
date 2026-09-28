// Worker thread for password hashing (step 5b). Plain JavaScript so it runs as-is
// from src/ under tests and from dist/ after bundling. bcryptjs is the library
// apps/app verifies with, so every hash here is accepted by today's sign-in.
import { parentPort } from 'node:worker_threads'
import bcrypt from 'bcryptjs'

parentPort.on('message', ({ id, op, password, hash, cost }) => {
  try {
    const result = op === 'hash' ? bcrypt.hashSync(password, cost) : bcrypt.compareSync(password, hash)
    parentPort.postMessage({ id, ok: true, result })
  } catch (err) {
    parentPort.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) })
  }
})
