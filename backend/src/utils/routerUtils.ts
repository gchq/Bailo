import { EntryKind, EntryKindKeys } from '../models/Model.js'

export const entryKindForRedirect = (entryKind: EntryKindKeys) => {
  switch (entryKind) {
    case EntryKind.Model:
      return 'model'
    case EntryKind.MirroredModel:
      return 'model'
    case EntryKind.UntrustedModel:
      return 'model'
    case EntryKind.DataCard:
      return 'data-card'
    case EntryKind.MirroredDataCard:
      return 'data-card'
    default:
      return 'model'
  }
}
