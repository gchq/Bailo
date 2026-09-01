import { Types } from 'mongoose'

import ResponseModel, { Decision, ResponseKind } from '../../models/Response.js'
import { UserInterface } from '../../models/User.js'
import { WebhookEvent } from '../../models/Webhook.js'
import { sendReviewResponseNotification } from '../../services/response.js'
import { ReviewKind } from '../../types/enums.js'
import { toEntity } from '../../utils/entity.js'
import { BadReq, NotFound } from '../../utils/error.js'
import { getModelReview } from '../../utils/review.js'
import { ReviewResponseParams } from '../response.js'
import { cancelLifecycleReviewJobs } from '../schedule/scheduler.js'
import { createLifecycleReview, findReviewById, isLifecycleReviewDateValid } from '../v3/review.js'
import { dispatchWebhooks } from '../webhook.js'

export async function respondToReview(
  user: UserInterface,
  reviewId: string,
  response: ReviewResponseParams,
  dueDate?: Date,
) {
  const review = getModelReview(await findReviewById(user, reviewId))
  if (review.kind === ReviewKind.Lifecycle && response.decision === Decision.Approve && dueDate) {
    if (dueDate.getTime() <= Date.now() || !isLifecycleReviewDateValid(dueDate)) {
      throw BadReq('Due date of next review is invalid.')
    }
  }

  // Store the response
  const reviewResponse = new ResponseModel({
    entity: toEntity('user', user.dn),
    kind: ResponseKind.Review,
    role: review.role,
    parentId: review._id,
    ...response,
  })

  await reviewResponse.save()
  await cancelLifecycleReviewJobs(review.modelId, reviewId)
  await sendReviewResponseNotification(review, reviewResponse, user)

  dispatchWebhooks(
    review.modelId,
    WebhookEvent.CreateReviewResponse,
    `A new response has been added to a review requested for Model ${review.modelId}`,
    { review: review },
  )

  if (review.kind === ReviewKind.Lifecycle && dueDate) {
    await createLifecycleReview(user, review.modelId, dueDate)
  }
  return reviewResponse
}

export async function getLatestResponseForReview(reviewId: string) {
  const response = await ResponseModel.findOne({ parentId: new Types.ObjectId(reviewId) }).sort({
    createdAt: -1,
  })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { reviewId })
  }

  return response
}
