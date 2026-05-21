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

function validateLifecycleReview(review: ReviewDoc, dueDate?: Date) {
  if (review.kind === ReviewKind.Lifecycle) {
    if (!dueDate) {
      throw BadReq('Lifecycle review responses should have a due date')
    }

    const currentDate = new Date()
    if (currentDate > dueDate) {
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
  validateLifecycleReview(review, dueDate)

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
