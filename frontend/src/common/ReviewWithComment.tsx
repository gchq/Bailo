import { LoadingButton } from '@mui/lab'
import { Autocomplete, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { SyntheticEvent, useMemo, useState } from 'react'

import { useGetModelRoles } from '../../actions/model'
import { useGetReviewRequestsForModel } from '../../actions/review'
import { AccessRequestInterface, ReleaseInterface, ReviewRequestInterface } from '../../types/types'
import { getRoleDisplay } from '../../utils/roles'
import MessageAlert from '../MessageAlert'
import Loading from './Loading'

export const ResponseTypes = {
  Approve: 'approve',
  RequestChanges: 'request_changes',
} as const

export type ResponseTypeKeys = (typeof ResponseTypes)[keyof typeof ResponseTypes]

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
  onSubmit: (kind: ResponseTypeKeys, reviewComment: string, reviewRole: string) => void
  loading?: boolean
} & PartialReviewWithCommentProps

export default function ReviewWithComment({
  onSubmit,
  loading = false,
  release,
  accessRequest,
}: ReviewWithCommentProps) {
  const theme = useTheme()
  const [reviewComment, setReviewComment] = useState('')
  const [errorText, setErrorText] = useState('')
  const [selectOpen, setSelectOpen] = useState(false)

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
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)
  const [reviewRequest, setReviewRequest] = useState(reviews[0])

  function invalidComment() {
    return reviewComment.trim() === '' ? true : false
  }

  function submitForm(decision: ResponseTypeKeys) {
    setErrorText('')

    if (invalidComment() && decision === ResponseTypes.RequestChanges) {
      setErrorText('You must submit a comment when requesting changes.')
    } else if (!reviewRequest.role) {
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

  return (
    <>
      {(isReviewsLoading || isModelRolesLoading) && <Loading />}
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
              // we might get a string or an object back
              isOptionEqualToValue={(option: ReviewRequestInterface, value: ReviewRequestInterface) =>
                option.role === value.role
              }
              onChange={onChange}
              value={reviewRequest}
              getOptionLabel={(option) => getRoleDisplay(option.role, modelRoles)}
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
                <LoadingButton
                  variant='outlined'
                  onClick={() => submitForm(ResponseTypes.RequestChanges)}
                  loading={loading}
                  data-test='requestChangesReviewButton'
                >
                  Request Changes
                </LoadingButton>
                <LoadingButton
                  variant='contained'
                  onClick={() => submitForm(ResponseTypes.Approve)}
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
