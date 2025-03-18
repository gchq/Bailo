import AccessRequestModel from '../models/AccessRequest.js'
import ReleaseModel from '../models/Release.js'
import ReviewModel from '../models/Review.js'

export async function up() {
  // Remove release comments array
  const releases = await ReleaseModel.find({})
  for (const release of releases) {
    if (release['comments'] !== undefined) {
      release.set('comments', undefined, { strict: false })
      await release.save()
    }
  }

  // Remove access request comments array
  const accessRequests = await AccessRequestModel.find({})
  for (const accessRequest of accessRequests) {
    if (accessRequest['comments'] !== undefined) {
      accessRequest.set('comments', undefined, { strict: false })
      await accessRequest.save()
    }
  }

  // Remove review responses array
  const reviews = await ReviewModel.find({})
  for (const review of reviews) {
    if (review['responses'] !== undefined) {
      review.set('responses', undefined, { strict: false })
      await review.save()
    }
  }
}

export async function down() {
  /* NOOP */
}
