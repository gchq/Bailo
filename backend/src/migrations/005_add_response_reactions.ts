import ResponseModel from '../models/Response.js'

export async function up() {
  const responses = await ResponseModel.find({})
  for (const response of responses) {
    if (response.reactions === undefined) {
      response.reactions = []
      await response.save()
    }
  }
}

export async function down() {
  /* NOOP */
}
