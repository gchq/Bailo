import Done from '@mui/icons-material/Done'
import { Stack, Typography } from '@mui/material'
import { useGetEntryRoles } from 'actions/entry'
import { useContext, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { ChangesRequestedDisplay } from 'src/entry/model/reviews/ChangesRequestedDisplay'
import MessageAlert from 'src/MessageAlert'
import { Decision, ReviewRequestInterface } from 'types/types'

export interface ReviewStatusProps {
  modelId: string
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

  if (isEntryRolesLoading) {
    return <Loading />
  }

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} severity='error' />
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
          <ChangesRequestedDisplay
            review={review}
            key={review._id}
            roleNameDisplay={roleNameDisplay}
            setErrorMessage={setErrorMessage}
            showCurrentUserResponses={showCurrentUserResponses}
          />
          <MessageAlert message={errorMessage} severity='error' />
        </>
      )}
    </>
  )
}
