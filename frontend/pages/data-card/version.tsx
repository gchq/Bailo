import { useRouter } from 'next/router'
import Title from 'src/common/Title'
import EntryCardVersion from 'src/entry/EntryCardVersion'
import { EntryKind } from 'types/types'
import { parseVersion } from 'utils/stringUtils'

export default function DataCardVersionPage() {
  const router = useRouter()
  const { entry, version, mirroredVersion }: { entry?: string; version?: string; mirroredVersion?: string } =
    router.query

  return (
    <>
      <Title text='Data Card Version' />
      <EntryCardVersion
        entryKind={EntryKind.DATA_CARD}
        entryId={entry}
        version={parseVersion(version)}
        mirroredVersion={parseVersion(mirroredVersion)}
      />
    </>
  )
}
