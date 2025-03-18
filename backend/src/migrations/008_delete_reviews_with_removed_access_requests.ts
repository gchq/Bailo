import AccessRequestModel from '../models/AccessRequest.js'
import { removeAccessRequestReviews } from '../services/review.js'

export async function up() {
  const deletedAccessRequests = await (AccessRequestModel as any).findDeleted()
  for (const accessRequest of deletedAccessRequests) {
    await removeAccessRequestReviews(accessRequest['id'])
  }
}

export async function down() {
  /* NOOP */
}
