import { LocalOffer } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { patchModel, useGetModel } from 'actions/model'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import UserDisplay from 'src/common/UserDisplay'
import EntryTagSelector from 'src/entry/model/releases/EntryTagSelector'
import EntryRolesDialog from 'src/entry/overview/EntryRolesDialog'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toSentenceCase } from 'utils/stringUtils'

interface OrganisationAndStateDetailsProps {
  entry: EntryInterface
}

export default function OrganisationStateCollaboratorsDetails({ entry }: OrganisationAndStateDetailsProps) {
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [entryTagUpdateErrorMessage, setEntryTagUpdateErrorMessage] = useState('')

  const { mutateModel } = useGetModel(entry.id)

  const theme = useTheme()
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const collaboratorList = useMemo(() => {
    return (
      <Stack direction='row' alignItems='center' spacing={1}>
        {entry.collaborators.slice(0, 5).map((collaborator) => {
          return <UserDisplay key={collaborator.entity} dn={collaborator.entity} displayAsAvatar smallAvatars />
        })}
        {entry.collaborators.length > 5 && <Typography>...and {entry.collaborators.length - 5} more</Typography>}
      </Stack>
    )
  }, [entry])

  const handleEntryTagOnChange = async (newTags: string[]) => {
    setEntryTagUpdateErrorMessage('')
    const response = await patchModel(entry.id, { tags: newTags })
    if (!response.ok) {
      setEntryTagUpdateErrorMessage(await getErrorMessage(response))
    } else {
      mutateModel()
    }
  }

  if (isUiConfigLoading) {
    return <Loading />
  }

  if (isUiConfigError) {
    return <ErrorWrapper message={isUiConfigError.info.message} />
  }

  return (
    <Box>
      <Stack spacing={2} sx={{ mr: 0, backgroundColor: theme.palette.container.main, p: 2, borderRadius: 2 }}>
        <Typography color='primary' variant='h6' component='h2'>
          {toSentenceCase(entry.kind)} Details
        </Typography>
        <Stack spacing={1}>
          {uiConfig && uiConfig.modelDetails.organisations.length > 0 && (
            <Box>
              <Typography>
                <span style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>Organisation: </span>
                {entry.organisation || <span style={{ fontStyle: 'italic' }}>Unset</span>}
              </Typography>
            </Box>
          )}
          {uiConfig && uiConfig.modelDetails.states.length > 0 && (
            <Box>
              <Typography>
                <span style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>State: </span>
                {entry.state || <span style={{ fontStyle: 'italic' }}>Unset</span>}
              </Typography>
            </Box>
          )}
        </Stack>
        <Stack spacing={1} sx={{ width: { sm: '100%', md: 'max-content' } }}>
          <Button
            size='small'
            onClick={() => setRolesDialogOpen(true)}
            sx={{ width: 'max-content', fontWeight: 'bold' }}
          >
            View collaborators
          </Button>
          {collaboratorList}
        </Stack>
        <Restricted action='editEntry' fallback={<></>}>
          <Button
            sx={{ width: 'fit-content' }}
            size='small'
            startIcon={<LocalOffer />}
            onClick={(event) => setAnchorEl(event.currentTarget)}
          >
            {`Edit ${entry.kind} tags ${entry.tags.length > 0 ? `(${entry.tags.length})` : ''}`}
          </Button>
        </Restricted>
        <EntryTagSelector
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          onChange={handleEntryTagOnChange}
          tags={entry.tags}
          errorText={entryTagUpdateErrorMessage}
        />
      </Stack>
      <EntryRolesDialog entry={entry} open={rolesDialogOpen} onClose={() => setRolesDialogOpen(false)} />
    </Box>
  )
}
