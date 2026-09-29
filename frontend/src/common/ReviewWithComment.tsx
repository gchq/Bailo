import { Dayjs } from '@dayjs'
import {
  Autocomplete,
  Button,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import { useGetResponses } from 'actions/response'
import { useRouter } from 'next/router'
import { ChangeEvent, SyntheticEvent, useContext, useEffect, useState } from 'react'
import RichTextEditor from 'src/common/RichTextEditor'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { increaseCurrentDateByHumanInterval, increaseCurrentDateInDays } from 'utils/dateUtils'
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
  modelId?: string
  includeDueDate?: boolean
  hideRequestChangesButton?: boolean
  deploymentAssessmentReview?: boolean
  onCancel?: () => void
}

export default function ReviewWithComment({
  onSubmit,
  loading = false,
  reviews,
  modelId,
  includeDueDate = false,
  hideRequestChangesButton = false,
  deploymentAssessmentReview = false,
  onCancel,
}: ReviewWithCommentProps) {
  const theme = useTheme()
  const router = useRouter()
  const [reviewComment, setReviewComment] = useState('')
  const [dueDate, setDueDate] = useState<Dayjs | null>(null)
  const [errorText, setErrorText] = useState('')
  const [selectOpen, setSelectOpen] = useState(false)
  const [decision, setDecision] = useState<DecisionKeys | undefined>(undefined)

  const uiConfig = useContext(UiConfigContext)

  function showUndoButton() {
    if (deploymentAssessmentReview) {
      return false
    }
    if (reviewRequest) {
      const latestReviewForRole = latestReviewsForEachUser([reviewRequest], responses).find(
        (latestReview) => latestReview.role === reviewRequest.role,
      )
      if (latestReviewForRole && latestReviewForRole.decision !== Decision.Undo) {
        return true
      } else {
        return false
      }
    }
    return false
  }

  const { responses, isResponsesLoading, isResponsesError } = useGetResponses([...reviews.map((review) => review._id)])
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles(modelId)

  const [reviewRequest, setReviewRequest] = useState<ReviewRequestInterface>(
    reviews.find((review) => review.role === router.query.role) || reviews[0],
  )

  function invalidComment() {
    return reviewComment.trim() === '' ? true : false
  }

  useEffect(() => {
    if (reviewRequest && !router.query.role) {
      router.replace({
        query: { ...router.query, role: reviewRequest.role },
      })
    }
  }, [router, reviewRequest])

  function handleSubmitOnClick() {
    submitForm(decision)
  }

  function submitForm(selectedDecision: DecisionKeys | undefined) {
    setErrorText('')
    if (!selectedDecision) {
      setErrorText('Unknown decision')
      return
    }

    if (invalidComment() && selectedDecision === Decision.RequestChanges) {
      setErrorText('You must submit a comment when requesting changes.')
    } else if (invalidComment() && selectedDecision === Decision.Reject) {
      setErrorText('You must submit a comment when rejecting.')
    } else if (!reviewRequest || !reviewRequest.role) {
      setErrorText('Please select a role before submitting your review.')
    } else {
      setReviewComment('')
      onSubmit(selectedDecision, reviewComment, reviewRequest.role, dueDate)
    }
  }

  const handleRadioChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDecision(event.target.value as DecisionKeys)
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
            {!deploymentAssessmentReview && (
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
            )}
            <RichTextEditor
              data-test='reviewWithCommentTextField'
              value={reviewComment}
              onChange={(newValue) => setReviewComment(newValue)}
              alwaysShowToolbar
            />
            <Typography variant='caption' color='error'>
              {errorText}
            </Typography>
            {includeDueDate && (
              <Stack spacing={0.5}>
                <Typography sx={{ fontWeight: 'bold' }}>Next review date</Typography>
                <DatePicker
                  value={dueDate}
                  onChange={(newValue) => {
                    setDueDate(newValue)
                  }}
                  minDate={increaseCurrentDateInDays(1)}
                  maxDate={
                    uiConfig.lifecycle.maxReviewInterval === ''
                      ? undefined
                      : increaseCurrentDateByHumanInterval(uiConfig.lifecycle.maxReviewInterval)
                  }
                />
              </Stack>
            )}
            <RadioGroup sx={{ mt: 0 }} defaultValue={undefined} value={decision} onChange={handleRadioChange}>
              {!hideRequestChangesButton && (
                <>
                  <FormControlLabel
                    value={Decision.RequestChanges}
                    label='Request changes'
                    control={<Radio size='small' sx={{ py: 0 }} data-test='requestChangesReviewButton' />}
                    slotProps={{
                      typography: { sx: { fontWeight: 'bold' } },
                    }}
                  />
                  <Typography sx={{ ml: 3.5, mt: 0 }} variant='caption'>
                    Needs some updates
                  </Typography>
                </>
              )}
              {deploymentAssessmentReview && (
                <>
                  <FormControlLabel
                    value={Decision.Reject}
                    label='Reject'
                    control={<Radio size='small' sx={{ py: 0 }} />}
                    slotProps={{
                      typography: { sx: { fontWeight: 'bold' } },
                    }}
                  />
                  <Typography sx={{ ml: 3.5, mt: 0 }} variant='caption'>
                    Not acceptable
                  </Typography>
                </>
              )}
              <FormControlLabel
                value={Decision.Approve}
                label='Approve'
                slotProps={{
                  typography: { sx: { fontWeight: 'bold' } },
                }}
                control={<Radio size='small' sx={{ py: 0 }} />}
                data-test='approveReviewButton'
              />
              <Typography sx={{ ml: 3.5, mt: 0 }} variant='caption' color={theme.palette.customTextInput.main}>
                {deploymentAssessmentReview ? uiConfig.deploymentAssessments.signOffDeclaration : 'Looks good to me'}
              </Typography>
            </RadioGroup>
            <Divider />
            <Stack
              spacing={2}
              direction={{ sm: 'row', xs: 'column' }}
              sx={{
                alignItems: 'center',
              }}
              divider={<Divider flexItem orientation='vertical' />}
            >
              {showUndoButton() && (
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
                </>
              )}
              <Stack direction='row' spacing={1}>
                <Button
                  disabled={decision === undefined}
                  onClick={handleSubmitOnClick}
                  variant='contained'
                  data-test='submitReviewButton'
                >
                  Submit
                </Button>
                {onCancel && <Button onClick={onCancel}>Cancel</Button>}
              </Stack>
            </Stack>
          </Stack>
        )}
      </div>
    </>
  )
}
