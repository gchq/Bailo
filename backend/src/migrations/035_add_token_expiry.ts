import TokenModel from '../models/Token.js'

// Pipeline $set only: never loads documents, so the pre('save') hook that hashes secretKey does not run.
// Tokens without createdAt fall back to the migration run time.
export async function up() {
  await TokenModel.updateMany({ lastRenewed: { $exists: false } }, [
    { $set: { lastRenewed: { $ifNull: ['$createdAt', new Date()] } } },
  ])
}

export async function down() {
  /* NOOP */
}
