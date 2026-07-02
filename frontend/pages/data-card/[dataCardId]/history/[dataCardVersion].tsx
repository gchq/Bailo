import { useRouter } from 'next/router'
import Title from 'src/common/Title'
import EntryCardHistory from 'src/entry/EntryCardHistory'
import { EntryKind } from 'types/types'
import { parseNat } from 'utils/stringUtils'

export default function DataCardVersion() {
  const router = useRouter()
  const {
    dataCardId: entryId,
    dataCardVersion: entryCardVersion,
    compareWith,
  }: {
    dataCardId?: string
    dataCardVersion?: string
    compareWith?: string
  } = router.query

  return (
    <>
      <Title text='Data Card Revision' />
      {entryId && entryCardVersion && (
        <EntryCardHistory
          entryId={entryId}
          entryCardVersion={parseNat(entryCardVersion)}
          compareWithVersion={compareWith !== undefined ? parseNat(compareWith) : undefined}
          entryKind={EntryKind.DATA_CARD}
        />
      )}
    </>
  )
}
