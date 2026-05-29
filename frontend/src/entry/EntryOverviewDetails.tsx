import { Info, LocalOffer } from '@mui/icons-material'
import { Box, Button, Divider, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals'
import { patchEntry, useGetEntry } from 'actions/entry'
import { postReview, useGetReviewRequestsForModel } from 'actions/review'
import { useGetSchema } from 'actions/schema'
import { useGetUiConfig } from 'actions/uiConfig'
import dayjs from 'dayjs'
import { useCallback, useContext, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import UserDisplay from 'src/common/UserDisplay'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import EntryTagSelector from 'src/entry/model/releases/EntryTagSelector'
import EntryRolesDialog from 'src/entry/overview/EntryRolesDialog'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import useNotification from 'src/hooks/useNotification'
import InformationDialog from 'src/schemas/InformationDialog'
import { EntryCardKindLabel, EntryInterface, ReviewKind } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toSentenceCase } from 'utils/stringUtils'

interface OrganisationAndStateDetailsProps {
  entry: EntryInterface
}

export default function EntryOverviewDetails({ entry }: OrganisationAndStateDetailsProps) {
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [entryTagUpdateErrorMessage, setEntryTagUpdateErrorMessage] = useState('')
  const [SchemaInformationOpen, setSchemaInformationOpen] = useState(false)

  const { mutateEntry } = useGetEntry(entry.id)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(entry.card ? entry.card.schemaId : '')
  const { reviews, isReviewsLoading, isReviewsError, mutateReviews } = useGetReviewRequestsForModel({
    modelId: entry.id,
    kind: ReviewKind.LIFECYCLE,
    open: true,
  })
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const { userPermissions } = useContext(UserPermissionsContext)

  const sendNotification = useNotification()
  const theme = useTheme()

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

  const updateReviewDatePermission = useMemo(() => userPermissions['editEntry'], [userPermissions])

  const handleEntryTagOnChange = async (newTags: string[]) => {
    setEntryTagUpdateErrorMessage('')
    const response = await patchEntry(entry.id, { tags: newTags })
    if (!response.ok) {
      setEntryTagUpdateErrorMessage(await getErrorMessage(response))
    } else {
      mutateEntry()
    }
  }

  const handleDueDateOnChange = useCallback(
    async (newReviewDate: PickerValue) => {
      const res = await postReview({ modelId: entry.id, kind: ReviewKind.LIFECYCLE, dueDate: newReviewDate })
      if (res.ok) {
        sendNotification({ msg: `Next review due date set to ${newReviewDate}`, variant: 'success' })
        mutateReviews()
      }
    },
    [entry.id, mutateReviews, sendNotification],
  )

  if (isUiConfigLoading || isSchemaLoading || isReviewsLoading) {
    return <Loading />
  }

  if (isUiConfigError) {
    return <ErrorWrapper message={isUiConfigError.info.message} />
  }

  if (isSchemaError) {
    return <ErrorWrapper message={isSchemaError.info.message} />
  }

  if (isReviewsError) {
    return <ErrorWrapper message={isReviewsError.info.message} />
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
        {entry.card && (
          <Stack spacing={1}>
            <Typography fontWeight='bold' color='primary'>
              Next review due:
            </Typography>
            {updateReviewDatePermission && (
              <DatePicker
                value={reviews && reviews[0] ? dayjs(reviews[0].dueDate) : undefined}
                sx={{ backgroundColor: 'unset', borderRadius: 1 }}
                onChange={(newValue) => {
                  handleDueDateOnChange(newValue)
                }}
                minDate={dayjs(new Date())}
              />
            )}
            {updateReviewDatePermission && reviews[0] && (
              <Button
                variant='outlined'
                size='small'
                href={`/model/${entry.id}/lifecycle/${reviews[0]._id}/review?role=owner`}
              >
                Review
              </Button>
            )}
            {!updateReviewDatePermission && <Typography>1/11/1029</Typography>}
          </Stack>
        )}
        <Box>
          <Restricted action='editEntry' fallback={<></>}>
            <Button
              sx={{ width: 'fit-content' }}
              size='small'
              startIcon={<LocalOffer />}
              onClick={(event) => setAnchorEl(event.currentTarget)}
            >
              {`Edit ${EntryCardKindLabel[entry.kind]} tags ${entry.tags.length > 0 ? `(${entry.tags.length})` : ''}`}
            </Button>
          </Restricted>
          <EntryTagSelector
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
            onChange={handleEntryTagOnChange}
            tags={entry.tags}
            errorText={entryTagUpdateErrorMessage}
          />
        </Box>
      </Stack>
      <EntryRolesDialog entry={entry} open={rolesDialogOpen} onClose={() => setRolesDialogOpen(false)} />
    </Box>
  )
}
