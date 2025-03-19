import { LoadingButton } from '@mui/lab'
import { Stack, Typography } from '@mui/material'
import { patchModel, useGetCurrentUserPermissionsForEntry, useGetModel, useGetModelRoles } from 'actions/model'
import { useState } from 'react'
import HelpDialog from 'src/common/HelpDialog'
import Loading from 'src/common/Loading'
import EntryRolesInfo from 'src/entry/model/settings/EntryRolesInfo'
import EntryAccessInput from 'src/entry/settings/EntryAccessInput'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toSentenceCase, toTitleCase } from 'utils/stringUtils'

type EntryAccessTabProps = {
  entry: EntryInterface
}

export default function EntryAccessTab({ entry }: EntryAccessTabProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [accessList, setAccessList] = useState<CollaboratorEntry[]>(entry.collaborators)

  const { isModelError: isEntryError, mutateModel: mutateEntry } = useGetModel(entry.id, entry.kind)
  const {
    modelRoles: entryRoles,
    isModelRolesLoading: isEntryRolesLoading,
    isModelRolesError: isEntryRolesError,
  } = useGetModelRoles(entry.id)

  const { mutateEntryUserPermissions } = useGetCurrentUserPermissionsForEntry(entry.id)
  const sendNotification = useNotification()

  async function updateAccessList() {
    setLoading(true)
    const res = await patchModel(entry.id, { collaborators: accessList })
    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      sendNotification({
        variant: 'success',
        msg: `${toTitleCase(entry.kind)} access list updated`,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
      mutateEntry()
      mutateEntryUserPermissions()
    }
    setLoading(false)
  }

  if (isEntryError) {
    return <MessageAlert message={isEntryError.info.message} severity='error' />
  }

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} severity='error' />
  }

  return (
    <Stack spacing={2}>
      {isEntryRolesLoading && <Loading />}
      <Stack spacing={1} direction='row' alignItems='center'>
        <Typography variant='h6' component='h2'>
          {`Manage ${toSentenceCase(entry.kind)} access`}
        </Typography>
        <HelpDialog title='What are roles?' content={<EntryRolesInfo entry={entry} />} />
      </Stack>
      <EntryAccessInput
        value={entry.collaborators}
        onUpdate={(val) => setAccessList(val)}
        entryKind={entry.kind}
        entryRoles={entryRoles}
      />
      <LoadingButton variant='contained' aria-label='Save access list' onClick={updateAccessList} loading={loading}>
        Save
      </LoadingButton>
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
}
