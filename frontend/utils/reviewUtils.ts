import { cloneDeep, groupBy } from 'lodash-es'
import { ReviewRequestInterface, ReviewResponse } from 'types/types'
import { sortByCreatedAtAscending } from 'utils/dateUtils'

interface GroupedReviewResponse {
  [user: string]: ReviewResponse[]
}

export function latestReviewsForEachUser(reviews: ReviewRequestInterface[]) {
  const latestReviews: ReviewRequestInterface[] = []
  reviews.forEach((review) => {
    const reviewResult: ReviewRequestInterface = cloneDeep(review)
    const groupedResponses: GroupedReviewResponse = groupBy(reviewResult.responses, (response) => response.user)
    const latestResponses: ReviewResponse[] = []
    Object.keys(groupedResponses).forEach((user) => {
      latestResponses.push(groupedResponses[user].sort(sortByCreatedAtAscending)[groupedResponses[user].length - 1])
    })
    reviewResult.responses = latestResponses
    latestReviews.push(reviewResult)
  })
  return latestReviews
}

export function reviewResponsesForEachUser(reviews: ReviewRequestInterface[]) {
  const allResponses: ReviewResponse[] = []
  reviews.forEach((review) => {
    const reviewResult: ReviewRequestInterface = cloneDeep(review)
    const groupedResponses: GroupedReviewResponse = groupBy(reviewResult.responses, (response) => response.user)
    Object.keys(groupedResponses).forEach((user) => {
      const sortedResponses = groupedResponses[user].sort(sortByCreatedAtAscending)
      sortedResponses.forEach((response, index) => {
        response.role = review.role
        index !== sortedResponses.length - 1 ? (response.outdated = true) : (response.outdated = false)
      })
      allResponses.push(...sortedResponses)
    })
  })
  return allResponses
}
