import { useRouter } from 'next/router'
import Title from 'src/common/Title'
import EntryCardHistory from 'src/entry/EntryCardHistory'
import { EntryKind } from 'types/types'
import { parseNat } from 'utils/stringUtils'

export default function ModelCardVersion() {
  const router = useRouter()
  const {
    modelId: entryId,
    modelCardVersion: entryCardVersion,
    compareWith,
    mirrored,
  }: {
    modelId?: string
    modelCardVersion?: string
    compareWith?: string
    mirrored?: string
  } = router.query

  return (
    <>
      <Title text='Model Card Revision' />
      {entryId && entryCardVersion && (
        <EntryCardHistory
          entryId={entryId}
          entryCardVersion={parseNat(entryCardVersion)}
          compareWithVersion={compareWith !== undefined ? parseNat(compareWith) : undefined}
          mirrored={mirrored === 'true'}
          entryKind={EntryKind.MODEL}
        />
      )}
    </>
  )
}
