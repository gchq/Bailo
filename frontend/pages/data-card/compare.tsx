import { useRouter } from 'next/router'
import Title from 'src/common/Title'
import EntryCardCompare from 'src/entry/EntryCardCompare'
import { EntryKind } from 'types/types'
import { parseVersion } from 'utils/stringUtils'

export default function DataCardComparePage() {
  const router = useRouter()
  const {
    fromEntry,
    fromVersion,
    fromMirroredVersion,
    toEntry,
    toVersion,
    toMirroredVersion,
  }: {
    fromEntry?: string
    fromVersion?: string
    fromMirroredVersion?: string
    toEntry?: string
    toVersion?: string
    toMirroredVersion?: string
  } = router.query

  return (
    <>
      <Title text='Compare Data Cards' />
      <EntryCardCompare
        entryKind={EntryKind.DATA_CARD}
        fromEntryId={fromEntry}
        fromVersion={parseVersion(fromVersion)}
        fromMirroredVersion={parseVersion(fromMirroredVersion)}
        toEntryId={toEntry}
        toVersion={parseVersion(toVersion)}
        toMirroredVersion={parseVersion(toMirroredVersion)}
      />
    </>
  )
}
