import { Schema } from 'mongoose'

import { AccessRequestAction, ModelAction, ReleaseAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import AccessRequestModel from '../../models/AccessRequest.js'
import ReleaseModel from '../../models/Release.js'
import ResponseModel, { Decision, ResponseKind } from '../../models/Response.js'
import { ReviewDoc } from '../../models/Review.js'
import { UserInterface } from '../../models/User.js'
import { WebhookEvent } from '../../models/Webhook.js'
import { sendReviewResponseNotification } from '../../services/response.js'
import { ReviewKind, ReviewKindKeys } from '../../types/enums.js'
import { toEntity } from '../../utils/entity.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../../utils/error.js'
import { getModelById } from '../model.js'
import { semverStringToObject } from '../release.js'
import { ReviewResponseParams } from '../response.js'
import { cancelLifecycleReviewJobs } from '../schedule/scheduler.js'
import { createLifecycleReview, findReviewById } from '../v3/review.js'
import { sendWebhooks } from '../webhook.js'

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

  sendWebhooks(
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

async function resolveCommentParent(user: UserInterface, modelId: string, kind: ReviewKindKeys, identifier?: string) {
  const model = await getModelById(user, modelId)
  if (!model) {
    throw NotFound('The requested model was not found', { modelId })
  }
  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId: model.id })
  }

  switch (kind) {
    case ReviewKind.Release: {
      if (!identifier) {
        throw BadReq('A valid semver must be provided for release comments.')
      }
      const semverObj = semverStringToObject(identifier)
      const release = await ReleaseModel.findOne({ modelId: model.id, semver: semverObj })
      if (!release) {
        throw NotFound(`The requested release was not found.`, { modelId: model.id, semver: identifier })
      }
      const auth = await authorisation.release(user, model, ReleaseAction.View, release)
      if (!auth.success) {
        throw Forbidden(auth.info, { userDn: user.dn, modelId: model.id, semver: release.semver })
      }
      return release._id
    }
    case ReviewKind.Access: {
      if (!identifier) {
        throw BadReq('A valid ID must be provided for access request comments.')
      }
      const accessRequest = await AccessRequestModel.findOne({ modelId: model.id, id: identifier })
      if (!accessRequest) {
        throw NotFound(`The requested access request was not found.`, {
          modelId: model.id,
          accessRequestId: identifier,
        })
      }
      const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.View)
      if (!auth.success) {
        throw Forbidden(auth.info, { userDn: user.dn, modelId: model.id, accessRequestId: accessRequest.id })
      }
      return accessRequest._id
    }
    case ReviewKind.Lifecycle: {
      return model._id
    }
    default: {
      const exhaustiveCheck: never = kind
      throw InternalError(`Unsupported review kind: ${exhaustiveCheck}`)
    }
  }
}

export async function newComment(
  user: UserInterface,
  modelId: string,
  kind: ReviewKindKeys,
  comment: string,
  identifier?: string,
) {
  const parentId = await resolveCommentParent(user, modelId, kind, identifier)

  // Store the response
  const commentResponse = new ResponseModel({
    entity: toEntity('user', user.dn),
    kind: ResponseKind.Comment,
    comment,
    createdAt: new Date().toISOString(),
    parentId,
  })

  const savedComment = await commentResponse.save()

  if (!savedComment) {
    throw InternalError('There was a problem saving this release comment')
  }

  return savedComment
}
