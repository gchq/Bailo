import AccessRequestModel from '../models/AccessRequest.js'
import ReviewModel from '../models/Review.js'
import { removeAccessRequestReview } from '../services/review.js'

export async function up() {
  // get the access requests
  const accessRequests = await AccessRequestModel.find({ deleted: false })
  // get all reviews
  const reviews = await ReviewModel.find({})
  // Remove access request reviews where the access request is already deleted
  for (const review of reviews) {
    const reviewAccessRequestId = review.get('accessRequestId')
    if (reviewAccessRequestId !== undefined) {
      // accessRequestId field indicates this is an access request review
      if (!accessRequests.some((accessRequest) => accessRequest.get('id') == reviewAccessRequestId)) {
        // couldn't find a corresponding access request meaning that it must have been deleted, so delete the review
        removeAccessRequestReview(reviewAccessRequestId)
      }
    }
  }
}

export async function down() {
  /* NOOP */
}
