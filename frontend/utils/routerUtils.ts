import { NextRouter } from 'next/router'
import { EntryKind, EntryKindKeys } from 'types/types'

export const entryKindForRedirect = (entryKind: EntryKindKeys) => {
  switch (entryKind) {
    case EntryKind.MODEL:
      return 'model'
    case EntryKind.MIRRORED_MODEL:
      return 'model'
    case EntryKind.UNTRUSTED_MODEL:
      return 'model'
    case EntryKind.DATA_CARD:
      return entryKind
    default:
      return 'model'
  }
}

export function buildModelCardHref(entryId: string, entryKind: EntryKindKeys, version: number): string {
  const comparePath = entryKind === EntryKind.DATA_CARD ? '/data-card/compare' : '/model-card/compare'

  const query = new URLSearchParams()

  query.set('fromModel', entryId)

  if (entryKind === EntryKind.MIRRORED_MODEL) {
    query.set('fromMirroredVersion', String(version))
  } else {
    query.set('fromVersion', String(version))
  }

  return `${comparePath}?${query.toString()}`
}

/** Updates `router.query` based on record. If a key is undefined it will be removed from the query.*/
export const updateQuery = (router: NextRouter, updates: Record<string, string | undefined>) => {
  const query = { ...router.query }
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === '') {
      delete query[key]
    } else {
      query[key] = value
    }
  }
  router.replace({ query }, undefined, { shallow: true })
}
