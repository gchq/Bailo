import { PipelineStage, Types } from 'mongoose'

import authentication from '../../connectors/authentication/index.js'
import { ModelAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import { ModelInterface, SystemRoles } from '../../models/Model.js'
import ReviewModel, { ReviewDoc, ReviewInterface } from '../../models/Review.js'
import { UserInterface } from '../../models/User.js'
import { ReviewKind } from '../../types/enums.js'
import config from '../../utils/config.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../../utils/error.js'
import log from '../log.js'
import { getModelById, getModelByIdNoAuth } from '../model.js'
import { scheduleLifeCycleReviewEmails } from '../schedule/scheduler.js'
import { notifyReviewRoleOfAdditionalReview } from '../smtp/smtp.js'

type ReviewWithModel = ReviewDoc & {
  model: ModelInterface
}

// v3 function for retrieving a review using the id
export async function findReviewById(user: UserInterface, reviewId: string): Promise<ReviewWithModel> {
  if (!Types.ObjectId.isValid(reviewId)) {
    throw BadReq('Invalid reviewId', { reviewId })
  }

  const review: ReviewWithModel | undefined = (
    await ReviewModel.aggregate<ReviewWithModel>()
      .match({
        _id: new Types.ObjectId(reviewId),
      })
      // Populate model entries
      .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
      // Populate model as value instead of array
      .unwind({ path: '$model' })
      .match(await findUserInCollaborators(user))
      .limit(1)
  ).at(0)
  if (!review) {
    throw NotFound(`Unable to find Review to respond to.`, { reviewId })
  }

  // Authorisation check to make sure the user can access a model
  await getModelById(user, review.modelId)

  return review
}

/**
 * Requires the model attribute.
 * Return the models where one of the user's entities is in the model's collaborators
 * and the role in the review is in the list of roles in that collaborator entry.
 */
export async function findUserInCollaborators(user: UserInterface) {
  const entities = await authentication.getEntities(user)
  return {
    $expr: {
      $gt: [
        {
          $size: {
            $filter: {
              input: '$model.collaborators',
              as: 'item',
              cond: {
                $and: [
                  {
                    $in: ['$$item.entity', entities],
                  },
                  {
                    $in: ['$role', '$$item.roles'],
                  },
                ],
              },
            },
          },
        },
        0,
      ],
    },
  }
}

type CreateLifecycleReviewContent = {
  kind: 'lifecycle'
  dueDate: Date
}
type CreateReleaseReviewContent = {
  kind: 'release'
  semver: string
}
type CreateAccessReviewContent = {
  kind: 'access'
  accessRequestId: string
}

export async function createReview(
  user: UserInterface,
  modelId: string,
  reviewContent: CreateLifecycleReviewContent | CreateReleaseReviewContent | CreateAccessReviewContent,
) {
  switch (reviewContent.kind) {
    case ReviewKind.Lifecycle:
      return await createLifecycleReview(user, modelId, reviewContent.dueDate)
    case ReviewKind.Release:
    case ReviewKind.Access:
      throw BadReq(`Creating ${reviewContent.kind} reviews is not supported yet in V3.`)

    default:
      throw BadReq('Unknown review kind')
  }
}

export async function createLifecycleReview(
  user: UserInterface,
  modelId: string,
  dueDate: Date,
): Promise<ReviewInterface> {
  if (!dueDate || dueDate.getTime() <= Date.now()) {
    throw BadReq('Due date of next review cannot be in the past.')
  }

  // Authorisation check to make sure the user can access a model
  const model = await getModelById(user, modelId)
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  const stages: PipelineStage[] = [
    {
      $match: {
        modelId,
        kind: ReviewKind.Lifecycle,
      },
    },
    {
      $lookup: {
        from: 'v2_responses',
        localField: '_id',
        foreignField: 'parentId',
        as: 'responses',
      },
    },
    {
      $match: {
        responses: { $size: 0 },
      },
    },
    {
      $limit: 1,
    },
  ]

  // If there any existing open reviews then we throw a 400
  const existingReviews = await ReviewModel.aggregate(stages)

  if (existingReviews.length > 0) {
    throw BadReq('This model has an open lifecycle review.', { modelId })
  }

  const newReview = new ReviewModel({
    modelId,
    role: SystemRoles.Owner,
    kind: ReviewKind.Lifecycle,
    dueDate,
  })
  await newReview.save()

  await scheduleLifeCycleReviewEmails(modelId, newReview._id.toString(), dueDate)

  return newReview
}

export async function notifyReviewer(user: UserInterface, reviewId: string) {
  const review = await findReviewById(user, reviewId)
  const model = await getModelByIdNoAuth(review.modelId)
  // `getModelById` would only determine view access to a model, we must make sure the user has write access too
  const auth = await authorisation.model(user, model, ModelAction.Write)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId: model.id })
  }

  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  const originalReview = await ReviewModel.findByIdAndUpdate(
    reviewId,
    {
      $set: { lastNotificationAt: new Date() },
    },
    // We want to store the original document for rollback purposes
    { new: false },
  )

  if (!originalReview) {
    throw BadReq('Could not find existing review.', { reviewId })
  }

  if (
    originalReview.lastNotificationAt &&
    Date.now() < originalReview.lastNotificationAt.getTime() + config.smtp.review.lastNotifiedCoolDownMs
  ) {
    await ReviewModel.findByIdAndUpdate(reviewId, { $set: { lastNotificationAt: originalReview.lastNotificationAt } })
    throw BadReq('A notification was already sent recently.')
  }

  try {
    await notifyReviewRoleOfAdditionalReview(user, originalReview)
  } catch (err) {
    await ReviewModel.findByIdAndUpdate(reviewId, { $set: { lastNotificationAt: originalReview.lastNotificationAt } })
    log.error(err, 'Failed to notify reviewer')
    throw InternalError('Notification to reviewer(s) could not be sent', { modelId: model.id, err })
  }
  return
}
