import AccessRequestModel from '../models/AccessRequest.js'
import FileModel from '../models/File.js'
import ModelModel from '../models/Model.js'
import ReleaseModel from '../models/Release.js'
import ResponseModel from '../models/Response.js'
import ReviewModel from '../models/Review.js'
import TokenModel from '../models/Token.js'
import WebhookModel from '../models/Webhook.js'

export async function up() {
  const modelTypesToUpdate = [
    AccessRequestModel,
    FileModel,
    ModelModel,
    ReleaseModel,
    ResponseModel,
    ReviewModel,
    TokenModel,
    WebhookModel,
  ]

  for (const modelTypeToUpdate of modelTypesToUpdate) {
    await (modelTypeToUpdate as any).updateManyDeleted({ deletedAt: { $exists: false } }, [
      { $set: { deletedAt: '$updatedAt' } },
    ])
  }
}

export async function down() {
  /* NOOP */
}
