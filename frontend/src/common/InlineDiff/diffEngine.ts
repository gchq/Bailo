import { diffArrays } from 'diff'

export type DiffOperation = 'equal' | 'insert' | 'delete'

export type DiffChunk<T> = {
  operation: DiffOperation
  value: T
}

export type SequenceEdit<T> =
  { operation: 'equal'; from: T; to: T } | { operation: 'insert'; to: T } | { operation: 'delete'; from: T }

type TextToken = {
  value: string
  kind: 'word' | 'separator'
}

// Stops very different large values from blocking rendering; they fall back to a whole-value replacement.
const MAX_EDIT_DISTANCE = 1000

/**
 * Splits text at Unicode word boundaries while retaining every original character in its segment.
 * Intl.Segmenter handles scripts such as CJK and contractions more reliably than a word-character regular expression.
 */
function tokenise(value: string): TextToken[] {
  if (typeof Intl.Segmenter === 'function') {
    return [...new Intl.Segmenter(undefined, { granularity: 'word' }).segment(value)].map(
      ({ segment, isWordLike }) => ({
        value: segment,
        kind: isWordLike ? 'word' : 'separator',
      }),
    )
  }

  // Keep a fallback for runtimes without Intl.Segmenter. This is lossless but less language-aware.
  return (value.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? []).map((segment) => ({
    value: segment,
    kind: (/^[\p{L}\p{N}_]+$/u.test(segment) ? 'word' : 'separator') as TextToken['kind'],
  }))
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

/**
 * Joins changed tokens across equal separators, while keeping equal word tokens as boundaries. The two sides are
 * accumulated independently so a changed separator is never copied into both the deleted and inserted values.
 */
function combineTextEdits(edits: SequenceEdit<TextToken>[]): DiffChunk<string>[] {
  const result: DiffChunk<string>[] = []
  let from = ''
  let to = ''
  let pending = false
  let equalSeparator = ''

  const flush = () => {
    if (from) {
      result.push({ operation: 'delete', value: from })
    }
    if (to) {
      result.push({ operation: 'insert', value: to })
    }
    from = ''
    to = ''
    pending = false
  }

  for (const edit of edits) {
    if (edit.operation === 'equal') {
      if (edit.from.kind === 'word') {
        flush()
        if (equalSeparator) {
          result.push({ operation: 'equal', value: equalSeparator })
          equalSeparator = ''
        }
        result.push({ operation: 'equal', value: edit.from.value })
      } else if (pending) {
        equalSeparator += edit.from.value
      } else {
        result.push({ operation: 'equal', value: edit.from.value })
      }
    } else if (edit.operation === 'delete') {
      pending = true
      from += equalSeparator + edit.from.value
      to += equalSeparator
      equalSeparator = ''
    } else {
      pending = true
      from += equalSeparator
      to += equalSeparator + edit.to.value
      equalSeparator = ''
    }
  }
  flush()
  if (equalSeparator) {
    result.push({ operation: 'equal', value: equalSeparator })
  }

  return result
}

export function diffText(from: string, to: string): DiffChunk<string>[] {
  if (from === to) {
    return [{ operation: 'equal', value: from }]
  }

  const edits = alignSequence(tokenise(from), tokenise(to), (fromToken, toToken) => fromToken.value === toToken.value)

  return combineChunks(combineTextEdits(edits))
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
