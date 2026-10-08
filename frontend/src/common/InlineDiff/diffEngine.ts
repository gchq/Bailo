export type DiffOperation = 'equal' | 'insert' | 'delete'

export type DiffChunk<T> = {
  operation: DiffOperation
  value: T
}

export type SequenceEdit<T> =
  { operation: 'equal'; from: T; to: T } | { operation: 'insert'; to: T } | { operation: 'delete'; from: T }

// LCS is O(n^2), so can crash the frontend via a large edit distance matrix. This is a fallback.
const MAX_DIFF_CELLS = 500 ** 2

/**
 * \s+              whitespace runs
 * [\p{L}\p{N}_]+   words, numbers and underscores
 * [^\s\p{L}\p{N}_] individual punctuation or symbols
 */
function tokenise(value: string): string[] {
  return value.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? []
}

function combineChunks(chunks: DiffChunk<string>[]): DiffChunk<string>[] {
  const result: DiffChunk<string>[] = []

  for (const chunk of chunks) {
    const previous = result.at(-1)

    if (previous?.operation === chunk.operation) {
      previous.value += chunk.value
    } else {
      result.push(chunk)
    }
  }

  return result
}

export function diffText(from: string, to: string): DiffChunk<string>[] {
  if (from === to) {
    return [{ operation: 'equal', value: from }]
  }

  const edits = alignSequence(tokenise(from), tokenise(to), (fromToken, toToken) => fromToken === toToken)

  return combineChunks(
    edits.map((edit) => ({ operation: edit.operation, value: edit.operation === 'insert' ? edit.to : edit.from })),
  )
}

export function alignSequence<T>(from: T[], to: T[], matches: (from: T, to: T) => boolean): SequenceEdit<T>[] {
  if (from.length * to.length > MAX_DIFF_CELLS) {
    return [
      ...from.map((value) => ({ operation: 'delete' as const, from: value })),
      ...to.map((value) => ({ operation: 'insert' as const, to: value })),
    ]
  }

  const table = Array.from({ length: from.length + 1 }, () => new Uint32Array(to.length + 1))

  for (let fromIndex = 1; fromIndex <= from.length; fromIndex += 1) {
    for (let toIndex = 1; toIndex <= to.length; toIndex += 1) {
      table[fromIndex][toIndex] = matches(from[fromIndex - 1], to[toIndex - 1])
        ? table[fromIndex - 1][toIndex - 1] + 1
        : Math.max(table[fromIndex - 1][toIndex], table[fromIndex][toIndex - 1])
    }
  }

  const result: SequenceEdit<T>[] = []
  let fromIndex = from.length
  let toIndex = to.length

  while (fromIndex || toIndex) {
    if (fromIndex && toIndex && matches(from[fromIndex - 1], to[toIndex - 1])) {
      result.push({
        operation: 'equal',
        from: from[fromIndex - 1],
        to: to[toIndex - 1],
      })
      fromIndex -= 1
      toIndex -= 1
    } else if (toIndex && (!fromIndex || table[fromIndex][toIndex - 1] >= table[fromIndex - 1][toIndex])) {
      result.push({
        operation: 'insert',
        to: to[toIndex - 1],
      })
      toIndex -= 1
    } else {
      result.push({
        operation: 'delete',
        from: from[fromIndex - 1],
      })
      fromIndex -= 1
    }
  }

  return result.reverse()
}
