import { LoadingButton } from '@mui/lab'
import { Autocomplete, Divider, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetResponses } from 'actions/response'
import { useRouter } from 'next/router'
import { SyntheticEvent, useEffect, useMemo, useState } from 'react'
import { latestReviewsForEachUser } from 'utils/reviewUtils'

import { useGetModelRoles } from '../../actions/model'
import { useGetReviewRequestsForModel } from '../../actions/review'
import {
  AccessRequestInterface,
  Decision,
  DecisionKeys,
  ReleaseInterface,
  ReviewRequestInterface,
} from '../../types/types'
import { getRoleDisplayName } from '../../utils/roles'
import MessageAlert from '../MessageAlert'
import Loading from './Loading'

type PartialReviewWithCommentProps =
  | {
      release: ReleaseInterface
      accessRequest?: never
    }
  | {
      release?: never
      accessRequest: AccessRequestInterface
    }

type ReviewWithCommentProps = {
  onSubmit: (kind: DecisionKeys, reviewComment: string, reviewRole: string) => void
  loading?: boolean
} & PartialReviewWithCommentProps

export default function ReviewWithComment({
  onSubmit,
  loading = false,
  release,
  accessRequest,
}: ReviewWithCommentProps) {
  const theme = useTheme()
  const router = useRouter()
  const [reviewComment, setReviewComment] = useState('')
  const [errorText, setErrorText] = useState('')
  const [selectOpen, setSelectOpen] = useState(false)
  const [showUndoButton, setShowUndoButton] = useState(false)

  const [modelId, semverOrAccessRequestIdObject] = useMemo(
    () =>
      release
        ? [release.modelId, { semver: release.semver }]
        : [accessRequest.modelId, { accessRequestId: accessRequest.id }],
    [release, accessRequest],
  )

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId,
    ...semverOrAccessRequestIdObject,
  })

  const { responses, isResponsesLoading, isResponsesError } = useGetResponses([...reviews.map((review) => review._id)])
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)

  const [reviewRequest, setReviewRequest] = useState<ReviewRequestInterface>(
    reviews.find((review) => review.role === router.query.role) || reviews[0],
  )

  function invalidComment() {
    return reviewComment.trim() === '' ? true : false
  }

  useEffect(() => {
    if (reviewRequest) {
      const latestReviewForRole = latestReviewsForEachUser([reviewRequest], responses).find(
        (latestReview) => latestReview.role === reviewRequest.role,
      )
      if (latestReviewForRole && latestReviewForRole.decision !== Decision.Undo) {
        setShowUndoButton(true)
      } else {
        setShowUndoButton(false)
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
      onSubmit(decision, reviewComment, reviewRequest.role)
    }
  }

  function onChange(_event: SyntheticEvent<Element, Event>, newValue: ReviewRequestInterface | null) {
    if (newValue) {
      setReviewRequest(newValue)
    }
  }

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  if (isResponsesError) {
    return <MessageAlert message={isResponsesError.info.message} severity='error' />
  }

  return (
    <>
      {(isReviewsLoading || isModelRolesLoading || isResponsesLoading) && <Loading />}
      <div data-test='reviewWithCommentContent'>
        {modelRoles.length === 0 && (
          <Typography color={theme.palette.error.main}>There was a problem fetching model roles.</Typography>
        )}
        {modelRoles.length > 0 && (
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
              getOptionLabel={(option) => getRoleDisplayName(option.role, modelRoles)}
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
            <Stack
              spacing={2}
              direction={{ sm: 'row', xs: 'column' }}
              justifyContent='space-between'
              alignItems='center'
            >
              <Stack spacing={2} direction={{ sm: 'row', xs: 'column' }}>
                {showUndoButton && (
                  <>
                    <LoadingButton
                      onClick={() => submitForm(Decision.Undo)}
                      loading={loading}
                      variant='contained'
                      color='warning'
                      data-test='undoReviewButton'
                    >
                      Undo Review
                    </LoadingButton>
                    <Divider flexItem orientation='vertical' />
                  </>
                )}
                <LoadingButton
                  variant='outlined'
                  onClick={() => submitForm(Decision.RequestChanges)}
                  loading={loading}
                  data-test='requestChangesReviewButton'
                >
                  Request Changes
                </LoadingButton>
                <LoadingButton
                  variant='contained'
                  onClick={() => submitForm(Decision.Approve)}
                  loading={loading}
                  data-test='approveReviewButton'
                >
                  Approve
                </LoadingButton>
              </Stack>
            </Stack>
          </Stack>
        )}
      </div>
    </>
  )
}
