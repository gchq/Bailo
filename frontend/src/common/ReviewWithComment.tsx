import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { SyntheticEvent, useMemo, useState } from 'react'

import { useGetModelRoles } from '../../actions/model'
import { useGetReviewRequestsForModel } from '../../actions/review'
import { AccessRequestInterface, ReviewRequestInterface } from '../../types/interfaces'
import { ReleaseInterface } from '../../types/types'
import { getRoleDisplay } from '../../utils/beta/roles'
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
  open: boolean
  title: string
  errorText: string
  onClose: () => void
  onSubmit: (kind: ResponseTypeKeys, reviewComment: string, reviewRole: string) => void
  description?: string
} & PartialReviewWithCommentProps

export default function ReviewWithComment({
  open,
  title,
  errorText,
  onClose,
  onSubmit,
  description,
  release,
  accessRequest,
}: ReviewWithCommentProps) {
  const theme = useTheme()
  const [reviewComment, setReviewComment] = useState('')
  const [showError, setShowError] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [modelId, semverOrAccessRequestIdObject] = useMemo(
    () =>
      release
        ? [release.modelId, { semver: release.semver }]
        : [accessRequest.modelId, { accessRequestId: accessRequest.id }],
    [release, accessRequest],
  )

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId,
    isActive: true,
    ...semverOrAccessRequestIdObject,
  })
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)
  const [reviewRequest, setReviewRequest] = useState(reviews[0])

  function invalidComment() {
    return reviewComment.trim() === '' ? true : false
  }

  function submitForm(decision: ResponseTypeKeys) {
    setShowError(false)
    setLoading(false)
    if (invalidComment() && decision === ResponseTypes.RequestChanges) {
      setShowError(true)
      setLoading(false)
    } else {
      onSubmit(decision, reviewComment, reviewRequest.role)
      setLoading(true)
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
      <Dialog fullWidth open={open} onClose={onClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
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
                disabled={reviews.length === 1}
                getOptionLabel={(option) => getRoleDisplay(option.role, modelRoles)}
                options={reviews}
                renderInput={(params) => <TextField {...params} label='Select your role' size='small' />}
              />
              {description && <DialogContentText>{description}</DialogContentText>}
              <TextField
                size='small'
                minRows={4}
                maxRows={8}
                multiline
                placeholder='Leave a comment'
                data-test='review-with-comment-input'
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                error={showError}
                helperText={showError ? 'You must submit a comment when requesting changes.' : ''}
              />
              <Stack
                spacing={2}
                direction={{ sm: 'row', xs: 'column' }}
                justifyContent='space-between'
                alignItems='center'
              >
                <Button onClick={onClose}>Cancel</Button>
                <Stack spacing={2} direction={{ sm: 'row', xs: 'column' }}>
                  <LoadingButton
                    variant='outlined'
                    onClick={() => submitForm(ResponseTypes.RequestChanges)}
                    loading={loading}
                  >
                    Request Changes
                  </LoadingButton>
                  <LoadingButton
                    variant='contained'
                    onClick={() => submitForm(ResponseTypes.Approve)}
                    loading={loading}
                  >
                    Approve
                  </LoadingButton>
                </Stack>
              </Stack>
              {errorText && (
                <Typography color={theme.palette.error.main} variant='caption'>
                  {errorText}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
