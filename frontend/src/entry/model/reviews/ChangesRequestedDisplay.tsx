import { HourglassEmpty, Refresh } from '@mui/icons-material'
import { Button, Stack, Typography } from '@mui/material'
import { postNotifyReviewer } from 'actions/review'
import { useState } from 'react'
import Restricted from 'src/common/Restricted'
import useNotification from 'src/hooks/useNotification'
import { ResponseInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface ChangesRequestedDisplayProps {
  response: ResponseInterface
  roleNameDisplay: (response: ResponseInterface) => string | undefined
  setErrorMessage: (errorMessage: string) => void
  showCurrentUserResponses: boolean
}

export function ChangesRequestedDisplay({
  response,
  roleNameDisplay,
  setErrorMessage,
  showCurrentUserResponses,
}: ChangesRequestedDisplayProps) {
  const [isNotifyButtonLoading, setIsNotifyButtonLoading] = useState(false)
  const sendNotification = useNotification()

  const handleNotifyReviewerOnClick = async (reviewId: string) => {
    setIsNotifyButtonLoading(true)
    setErrorMessage('')
    const res = await postNotifyReviewer(reviewId)
    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      sendNotification({
        variant: 'success',
        msg: 'Reviewers have been notified.',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
    setIsNotifyButtonLoading(false)
  }

  return (
    <Stack direction='row' key={response._id} sx={{ alignItems: 'center' }} spacing={1}>
      <HourglassEmpty color='warning' fontSize='small' />
      <Typography variant='caption'>
        {showCurrentUserResponses
          ? `You have requested changes as a ${roleNameDisplay(response)}`
          : `Changes requested by  ${roleNameDisplay(response)}`}
      </Typography>
      <Restricted action='editRelease' fallback={<></>}>
        <>
          {
            <Button
              size='small'
              onClick={() => handleNotifyReviewerOnClick(response.parentId)}
              startIcon={<Refresh />}
              loading={isNotifyButtonLoading}
            >
              Request re-review
            </Button>
          }
        </>
      </Restricted>
    </Stack>
  )
}
