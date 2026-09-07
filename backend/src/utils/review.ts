import { ReviewInterface } from '../models/Review.js'
import { ReviewKind } from '../types/enums.js'
import { BadReq } from './error.js'

type ModelReview<T extends ReviewInterface> = T extends { kind: typeof ReviewKind.DeploymentAssessment } ? never : T

// TODO: Remove backwards lookup on review objects and bind them to the document being reviewed.
export function getModelReview<T extends ReviewInterface>(review: T): ModelReview<T> {
  if (review.kind === ReviewKind.DeploymentAssessment) {
    throw BadReq('Deployment assessment reviews are handled separately.', { reviewId: review._id.toString() })
  }

  return review as ModelReview<T>
}
