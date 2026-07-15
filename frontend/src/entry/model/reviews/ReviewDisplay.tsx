import Done from '@mui/icons-material/Done'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useGetEntryRoles } from 'actions/entry'
import { useContext, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { ChangesRequestedDisplay } from 'src/entry/model/reviews/ChangesRequestedDisplay'
import MessageAlert from 'src/MessageAlert'
import { Decision, ResponseInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { fromEntity } from 'utils/entityUtils'
import { plural } from 'utils/stringUtils'

export interface ReviewDisplayProps {
  modelId: string
  reviewResponses: ResponseInterface[]
  showCurrentUserResponses?: boolean
  currentUserDn?: string
}

export default function ReviewDisplay({
  reviewResponses,
  modelId,
  showCurrentUserResponses = false,
  currentUserDn,
}: ReviewDisplayProps) {
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles(modelId)
  const uiConfig = useContext(UiConfigContext)
  const dynamicRoles = useMemo(() => {
    const staticRoles = ['owner', 'contributor', 'consumer']
    return entryRoles.filter((role) => !staticRoles.includes(role.shortName))
  }, [entryRoles])

  const [errorMessage, setErrorMessage] = useState('')

  const orderedReviewResponses = useMemo(
    () =>
      reviewResponses
        .filter((response) =>
          currentUserDn && showCurrentUserResponses ? fromEntity(response.entity).id === currentUserDn : true,
        )
        .sort(sortByCreatedAtDescending) || [],
    [reviewResponses, currentUserDn, showCurrentUserResponses],
  )

  const roleNameDisplay = (response: ResponseInterface) => {
    if (response.role === 'owner') {
      return uiConfig.roleDisplayNames.owner
    }
    return dynamicRoles.find((role) => role.shortName === response.role)?.name
  }

  if (isEntryRolesLoading) {
    return <Loading />
  }

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} severity='error' />
  }

  return (
    <>
      <Stack>
        {orderedReviewResponses.some((reviewResponse) => reviewResponse.decision === Decision.Approve) && (
          <Tooltip title={`${plural(orderedReviewResponses.length, 'review')}`}>
            <Stack>
              {orderedReviewResponses
                .filter((reviewResponse) => reviewResponse.decision === Decision.Approve)
                .map((response) => {
                  return (
                    <Stack direction='row' key={roleNameDisplay(response)}>
                      <Done color='success' fontSize='small' />
                      <Typography variant='caption'>
                        {showCurrentUserResponses
                          ? `You have approved as a ${roleNameDisplay(response)}`
                          : `Approved by  ${roleNameDisplay(response)}`}
                      </Typography>
                    </Stack>
                  )
                })}
            </Stack>
          </Tooltip>
        )}
        {orderedReviewResponses.some((reviewResponse) => reviewResponse.decision === Decision.RequestChanges) && (
          <>
            <Tooltip title={`${plural(orderedReviewResponses.length, 'review')}`}>
              <Stack>
                {orderedReviewResponses
                  .filter((reviewResponse) => reviewResponse.decision === Decision.RequestChanges)
                  .map((response) => {
                    return (
                      <ChangesRequestedDisplay
                        response={response}
                        key={response._id}
                        roleNameDisplay={roleNameDisplay}
                        setErrorMessage={setErrorMessage}
                        showCurrentUserResponses={showCurrentUserResponses}
                      />
                    )
                  })}
              </Stack>
            </Tooltip>
            <MessageAlert message={errorMessage} severity='error' />
          </>
        )}
      </Stack>
      {reviewResponses.length === 0 && <Typography variant='caption'>Awaiting review</Typography>}
    </>
  )
}
