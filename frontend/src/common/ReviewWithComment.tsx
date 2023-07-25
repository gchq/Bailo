import { Button, Dialog, DialogContent, DialogContentText, DialogTitle, Stack, TextField } from '@mui/material'
import { useState } from 'react'

type ReviewWithCommentProps = {
  open: boolean
  onClose: () => void
  onSubmit: (kind: ResponseTypeKeys, reviewComment: string) => void
  title: string
  description: string
}

export const ResponseTypes = {
  Approve: 'approve',
  RequestChanges: 'request changes',
  Reject: 'reject',
} as const

type ResponseTypeKeys = (typeof ResponseTypes)[keyof typeof ResponseTypes]

export default function ReviewWithComment({ title, description, open, onClose, onSubmit }: ReviewWithCommentProps) {
  const [reviewComment, setReviewComment] = useState('')
  const [showError, setShowError] = useState(false)

  function invalidComment() {
    return reviewComment.trim() === '' ? true : false
  }

  function submitForm(kind: ResponseTypeKeys) {
    setShowError(false)
    if (invalidComment() && (kind === ResponseTypes.Reject || kind === ResponseTypes.RequestChanges)) {
      setShowError(true)
    } else {
      onSubmit(kind, reviewComment)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>{description}</DialogContentText>
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
              helperText={showError ? 'You must submit a comment when either rejecting or requesting changes.' : ''}
            />
            <Stack
              spacing={2}
              direction={{ sm: 'row', xs: 'column' }}
              justifyContent='space-between'
              alignItems='center'
            >
              <Button variant='outlined' onClick={onClose}>
                Cancel
              </Button>
              <Stack spacing={2} direction={{ sm: 'row', xs: 'column' }}>
                <Button color='error' variant='contained' onClick={() => submitForm(ResponseTypes.Reject)}>
                  Reject
                </Button>
                <Button variant='contained' onClick={() => submitForm(ResponseTypes.RequestChanges)}>
                  Request Changes
                </Button>
                <Button variant='contained' onClick={() => submitForm(ResponseTypes.Approve)}>
                  Approve
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  )
}
