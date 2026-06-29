import { LocalOffer } from '@mui/icons-material'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals'
import { patchEntry, useGetEntry } from 'actions/entry'
import { postReview, useGetReviewRequestsForModel } from 'actions/review'
import { useGetUiConfig } from 'actions/uiConfig'
import { useCallback, useContext, useMemo, useState } from 'react'
import EntrySelect from 'src/common/EntrySelect'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import UserDisplay from 'src/common/UserDisplay'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import LastReviewOverviewDetails from 'src/entry/LastReviewOverviewDetails'
import EntryTagSelector from 'src/entry/model/releases/EntryTagSelector'
import EntryRolesDialog from 'src/entry/overview/EntryRolesDialog'
import ReviewHistoryDialog from 'src/entry/overview/ReviewHistoryDialog'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import useNotification from 'src/hooks/useNotification'
import { EntryCardKindLabel, EntryInterface, EntryKind, ReviewKind } from 'types/types'
import { formatDateStringAsDayMonthAndYear, increaseCurrentDateInDays } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'
import { toSentenceCase } from 'utils/stringUtils'

interface OrganisationAndStateDetailsProps {
  entry: EntryInterface
}

export default function EntryOverviewDetails({ entry }: OrganisationAndStateDetailsProps) {
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [entryTagUpdateErrorMessage, setEntryTagUpdateErrorMessage] = useState('')
  const [reviewHistoryOpen, setReviewHistoryOpen] = useState(false)
  const [reviewDate, setReviewDate] = useState<PickerValue>()

  const sendNotification = useNotification()

  const { mutateEntry } = useGetEntry(entry.id)
  const { reviews, isReviewsLoading, isReviewsError, mutateReviews } = useGetReviewRequestsForModel({
    modelId: entry.id,
    kind: ReviewKind.LIFECYCLE,
    open: true,
  })
  const {
    reviews: archivedReviews,
    isReviewsLoading: isArchivedReviewsLoading,
    isReviewsError: isArchivedReviewsError,
    mutateReviews: mutateArchivedReviews,
  } = useGetReviewRequestsForModel({
    modelId: entry.id,
    kind: ReviewKind.LIFECYCLE,
    open: false,
  })
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const { userPermissions } = useContext(UserPermissionsContext)
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

  const updateEntryPermission = useMemo(() => userPermissions['editEntry'], [userPermissions])

  const handleEntryTagOnChange = async (newTags: string[]) => {
    setEntryTagUpdateErrorMessage('')
    const response = await patchEntry(entry.id, { tags: newTags })
    if (!response.ok) {
      setEntryTagUpdateErrorMessage(await getErrorMessage(response))
    } else {
      mutateEntry()
    }
  }

  const handleConfirmReviewDate = useCallback(async () => {
    const res = await postReview({ modelId: entry.id, kind: ReviewKind.LIFECYCLE, dueDate: reviewDate })
    if (res.ok) {
      sendNotification({ msg: 'Next model card review date set.', variant: 'success' })
      mutateArchivedReviews()
      mutateReviews()
    } else {
      sendNotification({ msg: await getErrorMessage(res), variant: 'error' })
    }
  }, [entry.id, mutateArchivedReviews, mutateReviews, reviewDate, sendNotification])

  if (isUiConfigLoading || isReviewsLoading || isArchivedReviewsLoading) {
    return <Loading />
  }

  if (isUiConfigError) {
    return <ErrorWrapper message={isUiConfigError.info.message} />
  }

  if (isReviewsError) {
    return <ErrorWrapper message={isReviewsError.info.message} />
  }

  if (isArchivedReviewsError) {
    return <ErrorWrapper message={isArchivedReviewsError.info.message} />
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
        <Stack>
          {uiConfig && uiConfig.modelDetails.organisations.length > 0 && (
            <EntrySelect
              label='Organisation'
              editable={updateEntryPermission.hasPermission}
              value={entry.organisation}
              entryId={entry.id}
              field='organisation'
              mutate={mutateEntry}
              options={uiConfig.modelDetails.organisations}
            />
          )}
          {uiConfig && uiConfig.modelDetails.states.length > 0 && entry.card && (
            <EntrySelect
              label='State'
              editable={entry.kind !== EntryKind.UNTRUSTED_MODEL && updateEntryPermission.hasPermission}
              value={entry.state}
              entryId={entry.id}
              field='state'
              mutate={mutateEntry}
              options={uiConfig.modelDetails.states}
            />
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
        {entry.kind !== EntryKind.DATA_CARD && entry.card && (
          <Stack spacing={1}>
            <Typography fontWeight='bold' color='primary'>
              Model card review
            </Typography>
            {updateEntryPermission.hasPermission && reviews.length === 0 && (
              <>
                <DatePicker
                  value={reviewDate}
                  sx={{ backgroundColor: 'unset', borderRadius: 1, maxWidth: 'fit-content' }}
                  onChange={(newValue) => {
                    setReviewDate(newValue)
                  }}
                  minDate={increaseCurrentDateInDays(1)}
                />
                <Button disabled={!reviewDate} sx={{ maxWidth: 'fit-content' }} onClick={handleConfirmReviewDate}>
                  Confirm
                </Button>
              </>
            )}
            {!updateEntryPermission.hasPermission && reviews.length === 0 && <em>No review date set</em>}
            <Stack
              direction={{ md: 'column', lg: 'row' }}
              spacing={1}
              sx={{ alignItems: 'center' }}
              divider={<Divider flexItem orientation='vertical' />}
            >
              {reviews.length > 0 && (
                <Typography>
                  {reviews[0].dueDate
                    ? formatDateStringAsDayMonthAndYear(reviews[0].dueDate.toString())
                    : 'Invalid date'}
                </Typography>
              )}
              {updateEntryPermission.hasPermission && reviews[0] && (
                <Button
                  size='small'
                  sx={{ width: 'fit-content' }}
                  href={`/model/${entry.id}/lifecycle/${reviews[0]._id}/review?role=owner`}
                  variant='outlined'
                >
                  Review
                </Button>
              )}
              {archivedReviews.length > 0 && (
                <Button
                  size='small'
                  onClick={() => {
                    setReviewHistoryOpen(true)
                  }}
                  variant='outlined'
                >
                  History
                </Button>
              )}
            </Stack>
            {archivedReviews.length > 0 && <LastReviewOverviewDetails reviewId={archivedReviews[0]._id} />}
          </Stack>
        )}
        <Stack spacing={1}>
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
      <ReviewHistoryDialog
        open={reviewHistoryOpen}
        onClose={() => setReviewHistoryOpen(false)}
        entry={entry}
        mutateEntry={mutateEntry}
      />
    </Box>
  )
}
