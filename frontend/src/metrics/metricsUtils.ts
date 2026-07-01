export const breakdownQueryTypes = ['byState', 'bySchema'] as const
export type BreakdownQueryType = (typeof breakdownQueryTypes)[number]

export type BreakdownQuery = {
  queryType: BreakdownQueryType
  queryValue: string
}

export type BreakdownQueryResult = { valid: true; query: BreakdownQuery } | { valid: false; error: string }

export function getBreakdownQuery(searchParams: URLSearchParams): BreakdownQueryResult {
  const matchedParams = breakdownQueryTypes
    .map((queryType) => {
      const queryValue = searchParams.get(queryType)
      return queryValue ? { queryType, queryValue } : null
    })
    .filter((item): item is BreakdownQuery => item !== null)

  if (matchedParams.length === 0) {
    return {
      valid: false,
      error: `No breakdown query parameter provided. Expected one of: ${breakdownQueryTypes.join(', ')}`,
    }
  }

  if (matchedParams.length > 1) {
    return {
      valid: false,
      error: `Only one breakdown query parameter may be provided at a time.`,
    }
  }

  return { valid: true, query: matchedParams[0] }
}
