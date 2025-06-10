import { groupBy } from 'lodash-es'
import { DecisionKeys, ResponseInterface, ReviewRequestInterface } from 'types/types'
import { sortByCreatedAtAscending } from 'utils/arrayUtils'

interface GroupedReviewResponse {
  [user: string]: ResponseInterface[]
}

export const finalisedDecisions: Array<DecisionKeys> = ['approve', 'deny']

export function isFinalised(decision: DecisionKeys | undefined) {
  return decision && finalisedDecisions.includes(decision)
}

export function latestReviewsForEachUser(reviews: ReviewRequestInterface[], responses: ResponseInterface[]) {
  const latestReviewResponses: ResponseInterface[] = []
  reviews.forEach((review) => {
    const filteredResponses = responses.filter((response) => response.parentId === review._id)
    const groupedResponses: GroupedReviewResponse = groupBy(filteredResponses, (response) => response.entity)
    const latestResponses: ResponseInterface[] = []
    Object.keys(groupedResponses).forEach((user) => {
      latestResponses.push(groupedResponses[user].sort(sortByCreatedAtAscending)[groupedResponses[user].length - 1])
    })
    latestReviewResponses.push(...latestResponses)
  })
  return latestReviewResponses
}

export function reviewResponsesForEachUser(reviews: ReviewRequestInterface[], responses: ResponseInterface[]) {
  const allResponses: ResponseInterface[] = []
  reviews.forEach((review) => {
    const filteredResponses = responses.filter((response) => response.parentId === review._id)
    const groupedResponses: GroupedReviewResponse = groupBy(filteredResponses, (response) => response.entity)
    Object.keys(groupedResponses).forEach((user) => {
      const sortedResponses = groupedResponses[user].sort(sortByCreatedAtAscending)
      sortedResponses.forEach((response, index) => {
        response.role = review.role
        if (index !== sortedResponses.length - 1) {
          response.outdated = true
        } else {
          response.outdated = false
        }
      })
      allResponses.push(...sortedResponses)
    })
  })
  return allResponses
}
