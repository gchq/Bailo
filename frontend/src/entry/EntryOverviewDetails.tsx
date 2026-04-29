import { Info } from '@mui/icons-material'
import { Box, Button, Divider, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { patchEntry, useGetEntry } from 'actions/entry'
import { useGetSchema } from 'actions/schema'
import { useGetUiConfig } from 'actions/uiConfig'
import { useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import TagSelector from 'src/common/TagSelector'
import UserDisplay from 'src/common/UserDisplay'
import EntryRolesDialog from 'src/entry/overview/EntryRolesDialog'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import InformationDialog from 'src/schemas/InformationDialog'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toSentenceCase } from 'utils/stringUtils'

interface OrganisationAndStateDetailsProps {
  entry: EntryInterface
}

export default function EntryOverviewDetails({ entry }: OrganisationAndStateDetailsProps) {
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)
  const [entryTagUpdateErrorMessage, setEntryTagUpdateErrorMessage] = useState('')
  const [SchemaInformationOpen, setSchemaInformationOpen] = useState(false)

  const { mutateEntry } = useGetEntry(entry.id)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(entry.card ? entry.card.schemaId : '')

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

  const handleEntryTagOnChange = useCallback(
    async (newTags: string[]) => {
      setEntryTagUpdateErrorMessage('')
      const response = await patchEntry(entry.id, { tags: newTags })
      if (!response.ok) {
        setEntryTagUpdateErrorMessage(await getErrorMessage(response))
        mutateEntry()
      } else {
        mutateEntry()
      }
    },
    [entry.id, mutateEntry],
  )

  if (isUiConfigLoading || isSchemaLoading) {
    return <Loading />
  }

  if (isUiConfigError) {
    return <ErrorWrapper message={isUiConfigError.info.message} />
  }

  if (isSchemaError) {
    return <ErrorWrapper message={isSchemaError.info.message} />
  }

  return (
    <Box>
      <Stack
        spacing={2}
        divider={<Divider flexItem />}
        sx={{ mr: 0, backgroundColor: theme.palette.container.main, p: 2, borderRadius: 2 }}
      >
        <Typography color='primary' variant='h6' component='h2'>
          {toSentenceCase(entry.kind)} details
        </Typography>
        <Stack spacing={1}>
          {schema && (
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography fontWeight='bold' sx={{ color: theme.palette.primary.main }}>
                Schema:
              </Typography>
              <Typography>{schema.name}</Typography>
              <IconButton onClick={() => setSchemaInformationOpen(true)}>
                <Info color='primary' fontSize='small' />
              </IconButton>
              <InformationDialog
                open={SchemaInformationOpen}
                schema={schema}
                onClose={() => setSchemaInformationOpen(false)}
              />
            </Stack>
          )}
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
        <Box>
          <TagSelector
            onChange={handleEntryTagOnChange}
            errorText={entryTagUpdateErrorMessage}
            tags={entry.tags}
            restrictedToAction={'editEntry'}
          ></TagSelector>
        </Box>
      </Stack>
      <EntryRolesDialog entry={entry} open={rolesDialogOpen} onClose={() => setRolesDialogOpen(false)} />
    </Box>
  )
}
