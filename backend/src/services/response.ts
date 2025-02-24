import ResponseModel, {
  Decision,
  ReactionKindKeys,
  ResponseInterface,
  ResponseKind,
  ResponseReaction,
} from '../models/Response.js'
import { ReviewDoc } from '../models/Review.js'
import { UserInterface } from '../models/User.js'
import { WebhookEvent } from '../models/Webhook.js'
import { ReviewKind, ReviewKindKeys } from '../types/enums.js'
import { toEntity } from '../utils/entity.js'
import { Forbidden, InternalError, NotFound } from '../utils/error.js'
import { getAccessRequestById } from './accessRequest.js'
import log from './log.js'
import { getReleaseBySemver } from './release.js'
import { findReviewForResponse, findReviewsForAccessRequests } from './review.js'
import { notifyReviewResponseForAccess, notifyReviewResponseForRelease } from './smtp/smtp.js'
import { sendWebhooks } from './webhook.js'

export async function findResponseById(responseId: string) {
  const response = await ResponseModel.findOne({
    _id: responseId,
  })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { responseId })
  }

  return response
}

export async function getResponsesByParentIds(_user: UserInterface, parentIds: string[]) {
  const responses = await ResponseModel.find({ parentId: { $in: parentIds } })

  if (!responses) {
    throw NotFound(`The requested response was not found.`, { parentIds })
  }

  return responses
}

export async function updateResponse(user: UserInterface, responseId: string, comment: string) {
  const response = await ResponseModel.findOne({ _id: responseId })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { responseId })
  }

  if (response.entity !== toEntity('user', user.dn)) {
    throw Forbidden('Only the original author can update a comment or review response.', {
      userDn: user.dn,
      responseId,
    })
  }

  response.comment = comment
  response.commentEditedAt = new Date().toISOString()
  response.save()

  return response
}

export async function updateResponseReaction(user: UserInterface, responseId: string, kind: ReactionKindKeys) {
  const response = await ResponseModel.findOne({ _id: responseId })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { responseId })
  }

  const updatedReaction = response.reactions.find((reaction) => reaction.kind === kind)

  if (!updatedReaction) {
    const newReaction: ResponseReaction = {
      kind,
      users: [user.dn],
    }
    response.reactions.push(newReaction)
  } else if (updatedReaction.users.includes(user.dn)) {
    updatedReaction.users = updatedReaction.users.filter((reactionUser) => reactionUser !== user.dn)
  } else {
    updatedReaction.users.push(user.dn)
  }

  await response.save()

  return response
}

export type ReviewResponseParams = Pick<ResponseInterface, 'comment' | 'decision' | 'reviewForm'>
export async function respondToReview(
  user: UserInterface,
  modelId: string,
  role: string,
  response: ReviewResponseParams,
  kind: ReviewKindKeys,
  reviewId: string,
): Promise<ResponseInterface> {
  console.log(response)
  const review = await findReviewForResponse(user, modelId, role, kind, reviewId)

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

  return reviewResponse
}

async function sendReviewResponseNotification(
  review: ReviewDoc,
  reviewResponse: ResponseInterface,
  user: UserInterface,
) {
  let reviewIdQuery
  switch (review.kind) {
    case ReviewKind.Access: {
      if (!review.accessRequestId) {
        log.error({ review }, 'Unable to send notification for review response. Cannot find access request ID.')
        return
      }

      const access = await getAccessRequestById(user, review.accessRequestId)
      notifyReviewResponseForAccess(reviewResponse, access).catch((error) =>
        log.warn({ error }, 'Error when notifying collaborators about review response.'),
      )
      break
    }
    case ReviewKind.Release: {
      if (!review.semver) {
        log.error({ review }, 'Unable to send notification for review response. Cannot find semver.')
        return
      }

      const release = await getReleaseBySemver(user, review.modelId, review.semver)
      notifyReviewResponseForRelease(reviewResponse, release).catch((error) =>
        log.warn({ error }, 'Error when notifying collaborators about review response.'),
      )
      break
    }
    default:
      throw InternalError('Review Kind not recognised', reviewIdQuery)
  }
}

export async function checkAccessRequestsApproved(accessRequestIds: string[]) {
  const reviews = await findReviewsForAccessRequests(accessRequestIds)
  const approvals = await ResponseModel.find({
    parentId: reviews.map((review) => review._id),
    decision: Decision.Approve,
  })
  return approvals.length > 0
}
