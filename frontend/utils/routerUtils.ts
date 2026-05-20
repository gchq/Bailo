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
