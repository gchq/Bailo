import { Types } from 'mongoose'

import authentication from '../../connectors/authentication/index.js'
import ReviewModel, { ReviewDoc } from '../../models/Review.js'
import { UserInterface } from '../../models/User.js'
import { NotFound } from '../../utils/error.js'
import { getModelById } from '../model.js'

// v3 function for retrieving a review using the id
export async function findReviewById(user: UserInterface, reviewId: string) {
  const review: ReviewDoc = (
    await ReviewModel.aggregate()
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
                    $in: ['$$item.entity', await authentication.getEntities(user)],
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
