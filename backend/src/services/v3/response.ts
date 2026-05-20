import ResponseModel, { Decision, ResponseKind } from '../../models/Response.js'
import ReviewModel from '../../models/Review.js'
import { UserInterface } from '../../models/User.js'
import { WebhookEvent } from '../../models/Webhook.js'
import { sendReviewResponseNotification } from '../../services/response.js'
import { ReviewKind } from '../../types/enums.js'
import { toEntity } from '../../utils/entity.js'
import { BadReq } from '../../utils/error.js'
import { ReviewResponseParams } from '../response.js'
import { findReviewById } from '../v3/review.js'
import { sendWebhooks } from '../webhook.js'

export async function respondToReview(
  user: UserInterface,
  reviewId: string,
  modelId: string,
  role: string,
  response: ReviewResponseParams,
  dueDate?: Date,
) {
  const review = await findReviewById(user, modelId, reviewId, role)

  if (review.kind === ReviewKind.Lifecycle && !dueDate) {
    throw BadReq('Lifecycle review responses should have a due date')
  }
  // Store the response
  const reviewResponse = new ResponseModel({
    entity: toEntity('user', user.dn),
    kind: ResponseKind.Review,
    role,
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

  // v3 When approving a model card review we need to create a new review using the supplied due date
  if (review.kind === ReviewKind.Lifecycle && response.decision === Decision.Approve) {
    const newReview = new ReviewModel({
      modelId,
      kind: review.kind,
      role,
      dueDate,
    })
    await newReview.save()
  }

  return reviewResponse
}
