import AccessRequestModel from '../models/AccessRequest.js'
import ReviewModel from '../models/Review.js'
import { removeAccessRequestReview } from '../services/review.js'

export async function up() {
  const accessRequests = await AccessRequestModel.find({ deleted: false })
  const reviews = await ReviewModel.find({})
  for (const review of reviews) {
    const reviewAccessRequestId = review.get('accessRequestId')
    if (
      reviewAccessRequestId &&
      !accessRequests.some((accessRequest) => accessRequest.get('id') == reviewAccessRequestId)
    ) {
      removeAccessRequestReview(reviewAccessRequestId)
    }
  }
}

export async function down() {
  /* NOOP */
}