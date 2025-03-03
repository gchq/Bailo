import AccessRequestModel from '../models/AccessRequest.js'
import FileModel from '../models/File.js'
import InferenceModel from '../models/Inference.js'
import ModelModel from '../models/Model.js'
import ModelCardRevisionModel from '../models/ModelCardRevision.js'
import ReleaseModel from '../models/Release.js'
import ResponseModel from '../models/Response.js'
import ReviewModel from '../models/Review.js'
import WebhookModel from '../models/Webhook.js'
import log from '../services/log.js'
import { connectToMongoose } from '../utils/database.js'

async function script() {
  const modelId = process.argv.slice(2)

  if (!modelId || !process.argv[2]) {
    log.error('No model ID option. Please use format "npm run script -- modelSoftDelete <model-id>"')
    return
  }

  await connectToMongoose()

  const model = await ModelModel.findOne({ id: modelId })
  if (!model) {
    log.error(`Cannot find model using ID ${modelId}`)
    return
  }
  const releases = await ReleaseModel.find({ modelId })
  log.info(`Deleting ${releases.length} releases`)
  for (const release of releases) {
    await release.delete()
  }

  const accesses = await AccessRequestModel.find({ modelId })
  log.info(`Deleting ${accesses.length} access requests`)
  for (const access of accesses) {
    await access.delete()
  }

  const revisions = await ModelCardRevisionModel.find({ modelId })
  log.info(`Deleting ${revisions.length} model card revisions`)
  for (const revision of revisions) {
    await revision.delete()
  }

  const reviews = await ReviewModel.find({ modelId })
  log.info(`Deleting ${reviews.length} reviews`)
  for (const review of reviews) {
    const responses = await ResponseModel.find({ parentId: review._id })
    log.info(`Deleting ${responses.length} responses from review ${review._id} `)
    for (const response of responses) {
      await response.delete()
    }
    await review.delete()
  }

  const files = await FileModel.find({ modelId })
  log.info(`Deleting ${accesses.length} files`)
  for (const file of files) {
    await file.delete()
  }

  const webhooks = await WebhookModel.find({ modelId })
  log.info(`Deleting ${webhooks.length} webhooks`)
  for (const webhook of webhooks) {
    await webhook.delete()
  }

  const inferences = await InferenceModel.find({ modelId })
  log.info(`Deleting ${inferences.length} inferences`)
  for (const inference of inferences) {
    await inference.delete()
  }

  await model.delete()
  return
}

script()
