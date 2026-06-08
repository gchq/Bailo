import { Autocomplete, Button, Divider, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import { useGetResponses } from 'actions/response'
import { Dayjs } from 'dayjs'
import { useRouter } from 'next/router'
import { SyntheticEvent, useEffect, useEffectEvent, useState } from 'react'
import { increaseCurrentDateInDays } from 'utils/dateUtils'
import { latestReviewsForEachUser } from 'utils/reviewUtils'

import { useGetEntryRoles } from '../../actions/entry'
import { Decision, DecisionKeys, ReviewRequestInterface } from '../../types/types'
import { getRoleDisplayName } from '../../utils/roles'
import MessageAlert from '../MessageAlert'
import Loading from './Loading'

type ReviewWithCommentProps = {
  onSubmit: (kind: DecisionKeys, reviewComment: string, reviewRole: string, dueDate: Dayjs | null) => void
  loading?: boolean
  reviews: ReviewRequestInterface[]
  modelId: string
  includeDueDate?: boolean
  hideRequestChangesButton?: boolean
}

export default function ReviewWithComment({
  onSubmit,
  loading = false,
  reviews,
  modelId,
  includeDueDate = false,
  hideRequestChangesButton = false,
}: ReviewWithCommentProps) {
  const theme = useTheme()
  const router = useRouter()
  const [reviewComment, setReviewComment] = useState('')
  const [dueDate, setDueDate] = useState<Dayjs | null>(null)
  const [errorText, setErrorText] = useState('')
  const [selectOpen, setSelectOpen] = useState(false)
  const [showUndoButton, setShowUndoButton] = useState(false)

  const { responses, isResponsesLoading, isResponsesError } = useGetResponses([...reviews.map((review) => review._id)])
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles(modelId)

  const [reviewRequest, setReviewRequest] = useState<ReviewRequestInterface>(
    reviews.find((review) => review.role === router.query.role) || reviews[0],
  )

  function invalidComment() {
    return reviewComment.trim() === '' ? true : false
  }

  const updateUndoButton = useEffectEvent((show: boolean) => {
    setShowUndoButton(show)
  })

  useEffect(() => {
    if (reviewRequest) {
      const latestReviewForRole = latestReviewsForEachUser([reviewRequest], responses).find(
        (latestReview) => latestReview.role === reviewRequest.role,
      )
      if (latestReviewForRole && latestReviewForRole.decision !== Decision.Undo) {
        updateUndoButton(true)
      } else {
        updateUndoButton(false)
      }
    }
  }, [responses, reviewRequest])

  useEffect(() => {
    if (reviewRequest && !router.query.role) {
      router.replace({
        query: { ...router.query, role: reviewRequest.role },
      })
    }
  }, [router, reviewRequest])

  function submitForm(decision: DecisionKeys) {
    setErrorText('')

    if (invalidComment() && decision === Decision.RequestChanges) {
      setErrorText('You must submit a comment when requesting changes.')
    } else if (!reviewRequest || !reviewRequest.role) {
      setErrorText('Please select a role before submitting your review.')
    } else {
      setReviewComment('')
      onSubmit(decision, reviewComment, reviewRequest.role, dueDate)
    }
  }

  function onChange(_event: SyntheticEvent<Element, Event>, newValue: ReviewRequestInterface | null) {
    if (newValue) {
      setReviewRequest(newValue)
    }
  }

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} severity='error' />
  }

  if (isResponsesError) {
    return <MessageAlert message={isResponsesError.info.message} severity='error' />
  }

  return (
    <>
      {(isEntryRolesLoading || isResponsesLoading) && <Loading />}
      <div data-test='reviewWithCommentContent'>
        {entryRoles.length === 0 && (
          <Typography color={theme.palette.error.main}>There was a problem fetching model roles.</Typography>
        )}
        {entryRoles.length > 0 && (
          <Stack spacing={2}>
            <Autocomplete
              sx={{ pt: 1 }}
              open={selectOpen}
              onOpen={() => {
                setSelectOpen(true)
              }}
              onClose={() => {
                setSelectOpen(false)
              }}
              isOptionEqualToValue={(option: ReviewRequestInterface, value: ReviewRequestInterface) =>
                option.role === value.role
              }
              onChange={onChange}
              value={reviewRequest}
              getOptionLabel={(option) => getRoleDisplayName(option.role, entryRoles)}
              options={reviews}
              renderInput={(params) => <TextField {...params} label='Select your role' size='small' />}
            />
            <TextField
              size='small'
              minRows={4}
              maxRows={8}
              multiline
              placeholder='Leave a comment'
              data-test='reviewWithCommentTextField'
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              error={errorText.length > 0}
              helperText={errorText}
            />
            {includeDueDate && (
              <Stack spacing={0.5}>
                <Typography fontWeight='bold'>Next review date</Typography>
                <DatePicker
                  value={dueDate}
                  onChange={(newValue) => {
                    setDueDate(newValue)
                  }}
                  minDate={increaseCurrentDateInDays(1)}
                />
              </Stack>
            )}
            <Stack
              spacing={2}
              direction={{ sm: 'row', xs: 'column' }}
              justifyContent='space-between'
              alignItems='center'
            >
              <Stack spacing={1} direction={{ sm: 'row', xs: 'column' }}>
                {showUndoButton && (
                  <>
                    <Button
                      onClick={() => submitForm(Decision.Undo)}
                      loading={loading}
                      variant='contained'
                      color='warning'
                      data-test='undoReviewButton'
                      size='small'
                    >
                      Undo review
                    </Button>
                    <Divider flexItem orientation='vertical' />
                  </>
                )}
                {!hideRequestChangesButton && (
                  <Button
                    variant='outlined'
                    onClick={() => submitForm(Decision.RequestChanges)}
                    loading={loading}
                    data-test='requestChangesReviewButton'
                    size='small'
                  >
                    Request changes
                  </Button>
                )}
                <Button
                  variant='contained'
                  onClick={() => submitForm(Decision.Approve)}
                  loading={loading}
                  data-test='approveReviewButton'
                  size='small'
                  disabled={includeDueDate && !dueDate}
                >
                  Approve
                </Button>
              </Stack>
            </Stack>
          </Stack>
        )}
      </div>
    </>
  )
}
