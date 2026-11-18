import TokenModel from '../models/Token.js'
import { getTokenLifetimeMs } from '../services/token.js'

// Pipeline $set only: never loads documents, so the pre('save') hook that hashes secretKey does not run.
// Tokens without createdAt fall back to the migration run time.
export async function up() {
  const lifetimeMs = getTokenLifetimeMs()

  await TokenModel.updateMany({ expiresAt: { $exists: false } }, [
    { $set: { expiresAt: { $add: [{ $ifNull: ['$createdAt', new Date()] }, lifetimeMs] } } },
  ])
}

export async function down() {
  /* NOOP */
}
