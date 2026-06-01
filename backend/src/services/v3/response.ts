import { PipelineStage } from 'mongoose'

import { ModelAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import ResponseModel, { Decision, ResponseKind } from '../../models/Response.js'
import ReviewModel, { ReviewDoc } from '../../models/Review.js'
import { UserInterface } from '../../models/User.js'
import { WebhookEvent } from '../../models/Webhook.js'
import { sendReviewResponseNotification } from '../../services/response.js'
import { ReviewKind } from '../../types/enums.js'
import { toEntity } from '../../utils/entity.js'
import { BadReq } from '../../utils/error.js'
import { ReviewResponseParams } from '../response.js'
import { findReviewById } from '../v3/review.js'
import { sendWebhooks } from '../webhook.js'

function validateLifecycleReview(review: ReviewDoc, dueDate?: Date | undefined) {
  if (review.kind === ReviewKind.Lifecycle) {
    if (!dueDate || dueDate.getTime() === 0) {
      throw BadReq('Lifecycle review responses should have a valid due date.')
    }
    if (dueDate.getTime() <= Date.now()) {
      throw BadReq('Due date of next review cannot be in the past.')
    }
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
  await sendReviewResponseNotification(review, reviewResponse, user)

  sendWebhooks(
    review.modelId,
    WebhookEvent.CreateReviewResponse,
    `A new response has been added to a review requested for Model ${review.modelId}`,
    { review: review },
  )

  const stages: PipelineStage[] = [
    {
      $match: {
        ...(review.modelId && { modelId: review.modelId }),
        kind: ReviewKind.Lifecycle,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    { $lookup: { from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' } },
    { $unwind: { path: '$model' } },
  ]
  stages.push({ $lookup: { from: 'v2_responses', localField: '_id', foreignField: 'parentId', as: 'responses' } })
  stages.push({ $addFields: { responseCount: { $size: '$responses' } } })
  stages.push({ $match: { responseCount: 0 } })
  stages.push({ $unset: ['responses', 'responseCount'] })

  let existingReviews = await ReviewModel.aggregate(stages)

  const auths = await authorisation.models(
    user,
    existingReviews.map((review) => review.model),
    ModelAction.Update,
  )
  existingReviews = existingReviews.filter((_, i) => auths[i].success)
  for (const existingReview of existingReviews) {
    const reviewToDelete = await ReviewModel.findOne({ _id: existingReview._id })
    if (reviewToDelete) {
      await reviewToDelete.delete()
    }
  }

  // When approving a model card review we need to create a new review using the supplied due date
  if (review.kind === ReviewKind.Lifecycle && response.decision === Decision.Approve) {
    const newReview = new ReviewModel({
      modelId: review.modelId,
      kind: review.kind,
      role: review.role,
      dueDate,
    })
    await newReview.save()
  }

  return reviewResponse
}
