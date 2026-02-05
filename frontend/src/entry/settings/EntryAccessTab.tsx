import { Save } from '@mui/icons-material'
import { Button, Divider, Stack, Typography } from '@mui/material'
import { patchEntry, useGetCurrentUserPermissionsForEntry, useGetEntry, useGetEntryRoles } from 'actions/entry'
import { useCallback, useState } from 'react'
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
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>(entry.collaborators)

  const { isEntryError, mutateEntry } = useGetEntry(entry.id)
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles(entry.id)

  const { mutateEntryUserPermissions } = useGetCurrentUserPermissionsForEntry(entry.id)
  const sendNotification = useNotification()

  const handleCollaboratorsChange = useCallback(
    (updatedCollaborators: CollaboratorEntry[]) => setCollaborators(updatedCollaborators),
    [],
  )

  async function updateCollaborators() {
    setLoading(true)
    const res = await patchEntry(entry.id, { collaborators })
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
    <Stack spacing={2} sx={{ mt: 2 }}>
      {isEntryRolesLoading && <Loading />}
      <Stack spacing={1} direction='row' alignItems='center'>
        <Typography variant='h6' component='h2' color='primary'>
          {`Manage ${toSentenceCase(entry.kind)} access`}
        </Typography>
        <HelpDialog title='What are roles?' content={<EntryRolesInfo entry={entry} />} />
      </Stack>
      <Divider />
      <EntryAccessInput
        value={entry.collaborators}
        onChange={handleCollaboratorsChange}
        entryKind={entry.kind}
        entryRoles={entryRoles}
      />
      <Button
        variant='contained'
        aria-label='Save access list'
        onClick={updateCollaborators}
        loading={loading}
        startIcon={<Save />}
        sx={{ maxWidth: 'fit-content' }}
      >
        Save
      </Button>
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
}
