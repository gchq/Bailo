import { Done } from '@mui/icons-material'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useGetEntryRoles } from 'actions/model'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
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
  const {
    entryRoles: modelRoles,
    isEntryRolesLoading: isModelRolesLoading,
    isEntryRolesError: isModelRolesError,
  } = useGetEntryRoles(modelId)
  const dynamicRoles = useMemo(() => {
    const staticRoles = ['owner', 'contributor', 'consumer']
    return modelRoles.filter((role) => !staticRoles.includes(role.shortName))
  }, [modelRoles])

  const orderedReviewResponses = useMemo(
    () =>
      reviewResponses
        .filter((response) =>
          currentUserDn && showCurrentUserResponses ? fromEntity(response.entity).value === currentUserDn : true,
        )
        .sort(sortByCreatedAtDescending) || [],
    [reviewResponses, currentUserDn, showCurrentUserResponses],
  )

  if (isModelRolesLoading) {
    return <Loading />
  }

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
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
                  const roleName = dynamicRoles.find((role) => role.shortName === response.role)?.name
                  return (
                    <Stack direction='row' key={roleName}>
                      <Done color='success' fontSize='small' />
                      <Typography variant='caption'>
                        {' '}
                        {showCurrentUserResponses ? `You have approved as a ${roleName}` : `Approved by  ${roleName}`}
                      </Typography>
                    </Stack>
                  )
                })}
            </Stack>
          </Tooltip>
        )}
        {orderedReviewResponses.some((reviewResponse) => reviewResponse.decision === Decision.RequestChanges) && (
          <Tooltip title={`${plural(orderedReviewResponses.length, 'review')}`}>
            <Stack>
              {orderedReviewResponses
                .filter((reviewResponse) => reviewResponse.decision === Decision.RequestChanges)
                .map((response) => {
                  const roleName = dynamicRoles.find((role) => role.shortName === response.role)?.name
                  return (
                    <Stack direction='row' key={roleName}>
                      <HourglassEmpty color='warning' fontSize='small' />
                      <Typography variant='caption'>
                        {showCurrentUserResponses
                          ? `You have requested changes as a ${roleName}`
                          : `Changes requested by  ${roleName}`}
                      </Typography>
                    </Stack>
                  )
                })}
            </Stack>
          </Tooltip>
        )}
      </Stack>
      {reviewResponses.length === 0 && <Typography variant='caption'>Awaiting review</Typography>}
    </>
  )
}
