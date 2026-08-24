import { EntryKind, EntryKindKeys } from '../models/Model.js'

export const entryKindForRedirect = (entryKind: EntryKindKeys) => {
  switch (entryKind) {
    case EntryKind.Model:
    case EntryKind.MirroredModel:
    case EntryKind.UntrustedModel:
      return 'model'
    case EntryKind.DataCard:
    case EntryKind.MirroredDataCard:
      return 'data-card'
    default:
      return 'model'
  }
}
