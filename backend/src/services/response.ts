import { ClientSession, Types } from 'mongoose'

import ResponseModel, {
  Decision,
  ReactionKindKeys,
  ResponseDoc,
  ResponseInterface,
  ResponseKind,
  ResponseReaction,
} from '../models/Response.js'
import ReviewModel, { ReviewDoc } from '../models/Review.js'
import { UserInterface } from '../models/User.js'
import { WebhookEvent } from '../models/Webhook.js'
import { ReviewKind, ReviewKindKeys } from '../types/enums.js'
import { toEntity } from '../utils/entity.js'
import { Forbidden, InternalError, NotFound } from '../utils/error.js'
import { getAccessRequestById } from './accessRequest.js'
import log from './log.js'
import { getReleaseBySemver } from './release.js'
import { findReviewForResponse, findReviews, findReviewsForAccessRequests } from './review.js'
import { notifyReleaseOnApproval, notifyReviewResponseForAccess, notifyReviewResponseForRelease } from './smtp/smtp.js'
import { dispatchWebhooks } from './webhook.js'

export async function findResponseById(responseId: string) {
  const response = await ResponseModel.findOne({
    _id: responseId,
  })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { responseId })
  }

  return response
}

export async function getResponsesByParentIds(parentIds: string[]) {
  const objectIds = parentIds.map((id) => new Types.ObjectId(id))
  const responses = await ResponseModel.find({ parentId: { $in: objectIds } })

  if (!responses) {
    throw NotFound(`The requested response was not found.`, { parentIds })
  }

  return responses
}

export async function getResponsesByUser(user: UserInterface) {
  const reviews = await findReviews(user, true, false)
  return await getResponsesByParentIds(reviews.map((review) => review._id.toString()))
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
  await response.save()

  return response
}

export async function removeResponses(parentIds: string[]) {
  const responses = await getResponsesByParentIds(parentIds)
  const responseDeletions: ResponseDoc[] = []
  for (const response of responses) {
    try {
      responseDeletions.push(await response.delete())
    } catch (error) {
      throw InternalError('The requested response could not be deleted.', {
        responseId: response.id,
        error,
      })
    }
  }
  return responseDeletions
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

export type ReviewResponseParams = Pick<ResponseInterface, 'comment' | 'decision'>
export async function respondToReview(
  user: UserInterface,
  modelId: string,
  role: string,
  response: ReviewResponseParams,
  kind: ReviewKindKeys,
  reviewId: string,
): Promise<ResponseInterface> {
  const review = await findReviewForResponse(user, modelId, role, kind, reviewId)
  let isApproved = false
  if (kind === ReviewKind.Release && review.semver) {
    isApproved = await checkReleaseApproved(modelId, review.semver)
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
  await sendReviewResponseNotification(review, reviewResponse, user, isApproved)

  dispatchWebhooks(
    review.modelId,
    WebhookEvent.CreateReviewResponse,
    `A new response has been added to a review requested for Model ${review.modelId}`,
    { review: review },
  )

  return reviewResponse
}

export async function sendReviewResponseNotification(
  review: ReviewDoc,
  reviewResponse: ResponseInterface,
  user: UserInterface,
  isApproved?: boolean,
) {
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
      if (!isApproved && (await checkReleaseApproved(release.modelId, release.semver))) {
        notifyReleaseOnApproval(release.modelId, release).catch((error) =>
          log.warn({ error }, 'Error when notifying release approval.'),
        )
      }
      break
    }
    case ReviewKind.Lifecycle: {
      // We don't need to notify anyone as this action is done by the person who would receive the notification.
      return
    }
    default:
      throw InternalError('Review kind not recognised', {
        reviewId: review['id'],
        modelId: review['modelId'],
        kind: review['kind'],
      })
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

export async function checkReleaseApproved(modelId: string, semver: string) {
  const reviewsWithoutApproval = await ReviewModel.aggregate([
    { $match: { semver, modelId } },
    {
      $lookup: {
        from: 'v2_responses',
        localField: '_id',
        foreignField: 'parentId',
        as: 'responses',
      },
    },
    {
      $addFields: {
        latestResponse: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: '$responses',
                sortBy: { createdAt: -1 },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $match: {
        $or: [{ latestResponse: { $exists: false } }, { 'latestResponse.decision': { $ne: Decision.Approve } }],
      },
    },
  ])

  const totalReviews = await ReviewModel.countDocuments({ semver })

  return totalReviews > 0 && reviewsWithoutApproval.length === 0
}

export async function removeResponsesByParentIds(parentIds: string[], session: ClientSession | undefined) {
  const objectIds = parentIds.map((id) => new Types.ObjectId(id))
  const responses = await ResponseModel.find({
    parentId: { $in: objectIds },
  })

  const deletions: ResponseDoc[] = []
  for (const response of responses) {
    try {
      deletions.push(await response.delete(session))
    } catch (error) {
      throw InternalError('The requested response could not be deleted.', {
        responseId: response._id,
        error,
      })
    }
  }

  return deletions
}
