import TokenModel, { HashType } from '../models/Token.js'

export async function up() {
  const tokens = await TokenModel.find({})

  for (const token of tokens) {
    if (token.hashMethod === undefined) {
      token.hashMethod = HashType.Bcrypt
      await token.save()
    }
  }
}

export async function down() {
  /* NOOP */
}
