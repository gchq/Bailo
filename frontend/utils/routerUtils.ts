import { type NextRouter } from 'next/router'
import { EntryKind, type EntryKindKeys } from 'types/types'

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

export const entryCardPath = (entryKind: EntryKindKeys) =>
  entryKind === EntryKind.DATA_CARD ? '/data-card' : '/model-card'

export function buildEntryCardVersionHref(
  entryId: string,
  entryKind: EntryKindKeys,
  version?: number,
  mirroredVersion?: number,
): string {
  const query = new URLSearchParams({ entry: entryId })
  if (version !== undefined) {
    query.set('version', String(version))
  }
  if (mirroredVersion !== undefined) {
    query.set('mirroredVersion', String(mirroredVersion))
  }
  return `${entryCardPath(entryKind)}/version?${query.toString()}`
}

export function buildModelCardHref(entryId: string, entryKind: EntryKindKeys, version: number): string {
  return entryKind === EntryKind.MIRRORED_MODEL
    ? buildEntryCardVersionHref(entryId, entryKind, undefined, version)
    : buildEntryCardVersionHref(entryId, entryKind, version)
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
