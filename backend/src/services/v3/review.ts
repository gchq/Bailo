import { PipelineStage, Types } from 'mongoose'

import authentication from '../../connectors/authentication/index.js'
import { ModelAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import { ModelInterface, SystemRoles } from '../../models/Model.js'
import ReviewModel, { ReviewDoc, ReviewInterface } from '../../models/Review.js'
import { UserInterface } from '../../models/User.js'
import { ReviewKind } from '../../types/enums.js'
import { BadReq, NotFound } from '../../utils/error.js'
import { getModelById } from '../model.js'

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

type CreateReviewContent =
  | ({
      accessRequestId: undefined
      semver: undefined
    } & CreateLifecycleReviewContent)
  | {
      kind: 'release'
      dueDate: undefined
      accessRequestId: undefined
      semver: string
    }
  | {
      kind: 'access'
      dueDate: undefined
      accessRequestId: string
      semver: undefined
    }

type CreateLifecycleReviewContent = {
  kind: 'lifecycle'
  dueDate: Date
}

export async function createReview(user: UserInterface, modelId: string, reviewContent: CreateReviewContent) {
  switch (reviewContent.kind) {
    case ReviewKind.Lifecycle:
      return await createLifecycleReview(user, modelId, reviewContent.dueDate)
    default:
    // TODO add functionality to create reviews for other review kinds
  }
}

async function createLifecycleReview(user: UserInterface, modelId: string, dueDate: Date): Promise<ReviewInterface> {
  const stages: PipelineStage[] = [
    {
      $match: {
        ...(modelId && { modelId }),
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
  stages.push({ $set: { deleted: true } })
  let existingReviews = await ReviewModel.aggregate(stages)

  const auths = await authorisation.models(
    user,
    existingReviews.map((review) => review.model),
    ModelAction.Update,
  )
  existingReviews = existingReviews.filter((_, i) => auths[i].success)
  if (existingReviews) {
    for (const existingReview of existingReviews) {
      const reviewToDelete = await ReviewModel.findOne({ _id: existingReview._id })
      if (reviewToDelete) {
        reviewToDelete.delete()
      }
    }
  }
  const newReview = new ReviewModel({
    modelId,
    role: SystemRoles.Owner,
    kind: ReviewKind.Lifecycle,
    dueDate,
  })
  await newReview.save()
  return newReview
}
