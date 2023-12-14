export async function partials<T, U>(
  data: Array<T>,
  existingResponses: Array<U>,
  process: Array<boolean>,
  func: (items: Array<T>) => Array<U>,
): Promise<Array<U>> {
  if (data.length !== process.length) {
    throw new Error(
      `Data and process array lengths must be identical.  Received ${data.length} data and ${process.length} process.`,
    )
  }

  const items = data.filter((_, i) => process[i])
  const responses = await Promise.resolve(func(items))

  if (responses.length !== items.length) {
    throw new Error('The function did not return a response for every item.')
  }

  let responsesIndex = 0
  const mergedResponses = existingResponses.map((response, i) => {
    if (process[i]) {
      return responses[responsesIndex++]
    }

    return response
  })

  return mergedResponses
}
