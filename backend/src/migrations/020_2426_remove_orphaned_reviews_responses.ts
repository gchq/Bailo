import ReleaseModel from '../models/Release.js'
import { ReviewDoc } from '../models/Review.js'
import { removeResponses } from '../services/response.js'
import { removeReleaseReviews } from '../services/review.js'

export async function up() {
  // Find all releases have already been marked as deleted
  const deletedReleases = await ReleaseModel.find({ deleted: true })
  const deletedReviews: ReviewDoc[] = []

  // For each deleted release, deleted the reviews associated with it
  for (const { modelId, semver } of deletedReleases) {
    const reviews = await removeReleaseReviews(modelId, semver)
    deletedReviews.push(...reviews)
  }

  const reviewIds = deletedReviews.map((r) => r.id)
  // For each deleted review, delete the responses associated with it
  const deletedResponses = await removeResponses(reviewIds)

  // Store some basic metadata about the migration
  return {
    foundDeletedReleases: deletedReleases.length,
    deletedReleaseReviews: deletedReviews.length,
    deletedResponses: deletedResponses.length,
  }
}

export async function down() {
  /* NOOP */
  // In theory we could save off the deleted items to metadata as they're only soft-deleted,
  // but there's no parent review anyway
}
