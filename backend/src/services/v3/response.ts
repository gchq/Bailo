import { Schema } from 'mongoose'

import ResponseModel, { Decision, ResponseKind } from '../../models/Response.js'
import { ReviewDoc } from '../../models/Review.js'
import { UserInterface } from '../../models/User.js'
import { WebhookEvent } from '../../models/Webhook.js'
import { findResponseById, sendReviewResponseNotification } from '../../services/response.js'
import { ReviewKind } from '../../types/enums.js'
import { toEntity } from '../../utils/entity.js'
import { BadReq, NotFound } from '../../utils/error.js'
import log from '../log.js'
import { ReviewResponseParams } from '../response.js'
import { cancelLifecycleReviewJobs } from '../schedule/scheduler.js'
import { notifyReviewerOfAdditionalReview } from '../smtp/smtp.js'
import { createLifecycleReview, findReviewById } from '../v3/review.js'
import { dispatchWebhooks } from '../webhook.js'

function validateLifecycleReview(review: ReviewDoc, dueDate?: Date | undefined) {
  if (!dueDate || dueDate.getTime() <= Date.now()) {
    throw BadReq('Due date of next review cannot be in the past.')
  }
}

export async function respondToReview(
  user: UserInterface,
  reviewId: string,
  response: ReviewResponseParams,
  dueDate?: Date,
) {
  const review = await findReviewById(user, reviewId)
  if (response.decision === Decision.Approve) {
    validateLifecycleReview(review, dueDate)
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
  const response = await ResponseModel.findOne({ parentId: reviewId as unknown as Schema.Types.ObjectId }).sort({
    createdAt: -1,
  })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { reviewId })
  }

  return response
}

export async function notifyReviewer(user: UserInterface, responseId: string) {
  const response = await findResponseById(responseId)
  const review = await findReviewById(user, response.parentId.toString())
  notifyReviewerOfAdditionalReview(user, response, review).catch((error) =>
    log.warn({ error }, 'Error when notifying reviewer about additional review.'),
  )
  return
}
