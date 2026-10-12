import { diffArrays } from 'diff'

export type DiffOperation = 'equal' | 'insert' | 'delete'

export type DiffChunk<T> = {
  operation: DiffOperation
  value: T
}

export type SequenceEdit<T> =
  { operation: 'equal'; from: T; to: T } | { operation: 'insert'; to: T } | { operation: 'delete'; from: T }

// Stops very different large values from blocking rendering; they fall back to a whole-value replacement.
const MAX_EDIT_DISTANCE = 1000

/**
 * Splits text into whitespace runs, Unicode words and single punctuation marks, keeping every character.
 * jsdiff's own word tokenisers only treat Latin letters as word characters.
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
  const changes = diffArrays(from, to, { comparator: matches, maxEditLength: MAX_EDIT_DISTANCE })

  if (!changes) {
    return [
      ...from.map((value) => ({ operation: 'delete' as const, from: value })),
      ...to.map((value) => ({ operation: 'insert' as const, to: value })),
    ]
  }

  const result: SequenceEdit<T>[] = []
  let fromIndex = 0
  let toIndex = 0

  for (const change of changes) {
    for (let count = 0; count < change.value.length; count += 1) {
      if (change.added) {
        result.push({ operation: 'insert', to: to[toIndex] })
        toIndex += 1
      } else if (change.removed) {
        result.push({ operation: 'delete', from: from[fromIndex] })
        fromIndex += 1
      } else {
        result.push({ operation: 'equal', from: from[fromIndex], to: to[toIndex] })
        fromIndex += 1
        toIndex += 1
      }
    }
  }

  return result
}
