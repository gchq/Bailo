import CloseIcon from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import { Stack, Typography } from '@mui/material'
import { useGetEntryRoles } from 'actions/entry'
import HourglassEmpty from 'node_modules/@mui/icons-material/HourglassEmpty.mjs'
import { useContext, useMemo, useState } from 'react'
import renderQueryState from 'src/common/renderQueryState'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { ReviewStatusDisplay } from 'src/entry/model/reviews/ReviewStatusDisplay'
import MessageAlert from 'src/MessageAlert'
import { Decision, ReviewRequestInterface } from 'types/types'

export interface ReviewStatusProps {
  modelId: string | null
  review: ReviewRequestInterface
  showCurrentUserResponses?: boolean
}

export default function ReviewStatus({ review, modelId, showCurrentUserResponses = false }: ReviewStatusProps) {
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles(modelId)
  const uiConfig = useContext(UiConfigContext)
  const dynamicRoles = useMemo(() => {
    const staticRoles = ['owner', 'contributor', 'consumer']
    return entryRoles.filter((role) => !staticRoles.includes(role.shortName))
  }, [entryRoles])

  const [errorMessage, setErrorMessage] = useState('')

  const roleNameDisplay = () => {
    if (review.role === 'owner') {
      return uiConfig.roleDisplayNames.owner
    }
    if (review.role === 'riskOwner') {
      return uiConfig.roleDisplayNames.riskOwner
    }
    return dynamicRoles.find((role) => role.shortName === review.role)?.name
  }

  const queryState = renderQueryState([isEntryRolesError], isEntryRolesLoading)
  if (queryState) {
    return queryState
  }

  return (
    <>
      {!review.status && <Typography variant='caption'>{`Awaiting review for ${roleNameDisplay()}`}</Typography>}
      {review.status === Decision.Approve && (
        <Stack direction='row' key={roleNameDisplay()} spacing={1} sx={{ alignItems: 'center' }}>
          <Done color='success' fontSize='small' />
          <Typography variant='caption'>
            {showCurrentUserResponses
              ? `You have approved as a ${roleNameDisplay()}`
              : `Approved by  ${roleNameDisplay()}`}
          </Typography>
        </Stack>
      )}
      {review.status === Decision.RequestChanges && (
        <>
          <ReviewStatusDisplay
            review={review}
            key={review._id}
            roleNameDisplay={roleNameDisplay}
            setErrorMessage={setErrorMessage}
            showCurrentUserResponses={showCurrentUserResponses}
            decision={review.status}
            icon={<HourglassEmpty color='warning' fontSize='small' />}
          />
          <MessageAlert message={errorMessage} severity='error' />
        </>
      )}
      {review.status === Decision.Reject && (
        <>
          <ReviewStatusDisplay
            review={review}
            key={review._id}
            roleNameDisplay={roleNameDisplay}
            setErrorMessage={setErrorMessage}
            showCurrentUserResponses={showCurrentUserResponses}
            decision={review.status}
            icon={<CloseIcon color='warning' fontSize='small' />}
          />
          <MessageAlert message={errorMessage} severity='error' />
        </>
      )}
    </>
  )
}
