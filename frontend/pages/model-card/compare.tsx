import { useRouter } from 'next/router'
import Title from 'src/common/Title'
import EntryCardCompare from 'src/entry/EntryCardCompare'
import { EntryKind } from 'types/types'
import { parseVersion } from 'utils/stringUtils'

export default function ModelCardComparePage() {
  const router = useRouter()
  const {
    fromModel,
    fromVersion,
    fromMirroredVersion,
    toModel,
    toVersion,
    toMirroredVersion,
  }: {
    fromModel?: string
    fromVersion?: string
    fromMirroredVersion?: string
    toModel?: string
    toVersion?: string
    toMirroredVersion?: string
  } = router.query

  return (
    <>
      <Title text='Compare Model Cards' />
      <EntryCardCompare
        entryKind={EntryKind.MODEL}
        fromEntryId={fromModel}
        fromVersion={parseVersion(fromVersion)}
        fromMirroredVersion={parseVersion(fromMirroredVersion)}
        toEntryId={toModel}
        toVersion={parseVersion(toVersion)}
        toMirroredVersion={parseVersion(toMirroredVersion)}
      />
    </>
  )
}
