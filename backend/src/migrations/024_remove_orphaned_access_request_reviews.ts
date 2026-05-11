import AccessRequestModel from '../models/AccessRequest.js'
import ResponseModel from '../models/Response.js'
import ReviewModel from '../models/Review.js'
import { useTransaction } from '../utils/transactions.js'

export async function up() {
  const deletedAccessRequests = await AccessRequestModel.find({ deleted: true })

  for (const accessRequest of deletedAccessRequests) {
    // ReviewModel instantiates with `accessRequestId: accessRequest.id`
    const reviewsForAccessRequest = await ReviewModel.find({ accessRequestId: accessRequest.id })
    await useTransaction([
      (session) => AccessRequestModel.updateOne({ id: accessRequest.id }, { deleted: true }, { session }),
      (session) => ReviewModel.updateMany({ accessRequestId: accessRequest.id }, { deleted: true }, { session }),
      (session) =>
        ResponseModel.updateMany(
          { parentId: [...reviewsForAccessRequest.map((review) => review._id), accessRequest._id] },
          { deleted: true },
          { session },
        ),
    ])
  }

  return {
    foundDeletedAccessRequests: deletedAccessRequests.length,
  }
}

export async function down() {
  /* NOOP */
}
