import { Button, Dialog, DialogContent, DialogContentText, DialogTitle, Stack, TextField } from '@mui/material'
import { useState } from 'react'

type ReviewWithCommentProps = {
  open: boolean
  onClose: () => void
  onSubmit: (kind: string, reviewComment: string) => void
  title: string
  description: string
}

enum ResponseTypes {
  APPROVE = 'approve',
  REQUEST_CHANGES = 'request changes',
  REJECT = 'reject',
}

export default function ReviewWithComment({ title, description, open, onClose, onSubmit }: ReviewWithCommentProps) {
  const [reviewComment, setReviewComment] = useState('')
  const [showError, setShowError] = useState(false)

  function invalidComment() {
    return reviewComment.trim() === '' ? true : false
  }

  function submitForm(kind: ResponseTypes) {
    setShowError(false)
    if (
      (kind === ResponseTypes.REJECT && invalidComment()) ||
      (kind === ResponseTypes.REQUEST_CHANGES && invalidComment())
    ) {
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
                <Button color='error' variant='contained' onClick={() => submitForm(ResponseTypes.REJECT)}>
                  Reject
                </Button>
                <Button variant='contained' onClick={() => submitForm(ResponseTypes.REQUEST_CHANGES)}>
                  Request Changes
                </Button>
                <Button variant='contained' onClick={() => submitForm(ResponseTypes.APPROVE)}>
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
