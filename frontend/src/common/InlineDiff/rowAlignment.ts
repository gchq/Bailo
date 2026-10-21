import { alignSequence } from 'src/common/InlineDiff/diffEngine'

export type IndexPair = { from?: number; to?: number }

export function alignByPosition(fromLength: number, toLength: number): IndexPair[] {
  return Array.from({ length: Math.max(fromLength, toLength) }, (_, index) => ({
    from: index < fromLength ? index : undefined,
    to: index < toLength ? index : undefined,
  }))
}

/** Pairs each unmatched old entry with the next related unmatched new entry from the same run, keeping their order. */
function pairUnmatched(
  deleted: number[],
  inserted: number[],
  isRelated: (from: number, to: number) => boolean,
): IndexPair[] {
  const pairs: IndexPair[] = []
  let nextInsert = 0

  for (const from of deleted) {
    const offset = inserted.slice(nextInsert).findIndex((to) => isRelated(from, to))

    if (offset === -1) {
      pairs.push({ from })
      continue
    }

    inserted.slice(nextInsert, nextInsert + offset).forEach((to) => pairs.push({ to }))
    pairs.push({ from, to: inserted[nextInsert + offset] })
    nextInsert += offset + 1
  }

  inserted.slice(nextInsert).forEach((to) => pairs.push({ to }))

  return pairs
}

/** Aligns by key, then pairs entries whose key changed when `isRelated` says they are still the same entry. */
export function alignByKey(
  fromKeys: string[],
  toKeys: string[],
  isRelated: (from: number, to: number) => boolean,
): IndexPair[] {
  const fromIndexes = fromKeys.map((_, index) => index)
  const toIndexes = toKeys.map((_, index) => index)
  const edits = alignSequence(fromIndexes, toIndexes, (from, to) => fromKeys[from] === toKeys[to])

  const result: IndexPair[] = []
  let deleted: number[] = []
  let inserted: number[] = []

  const flush = () => {
    result.push(...pairUnmatched(deleted, inserted, isRelated))
    deleted = []
    inserted = []
  }

  for (const edit of edits) {
    if (edit.operation === 'equal') {
      flush()
      result.push({ from: edit.from, to: edit.to })
    } else if (edit.operation === 'delete') {
      deleted.push(edit.from)
    } else {
      inserted.push(edit.to)
    }
  }
  flush()

  return result
}

/** Aligns rows by key when every key is unique in both lists, otherwise by position. */
export function alignKeyedRows(
  fromKeys: string[],
  toKeys: string[],
  isRelated: (from: number, to: number) => boolean,
): IndexPair[] {
  const hasUniqueKeys = new Set(fromKeys).size === fromKeys.length && new Set(toKeys).size === toKeys.length

  return hasUniqueKeys ? alignByKey(fromKeys, toKeys, isRelated) : alignByPosition(fromKeys.length, toKeys.length)
}
