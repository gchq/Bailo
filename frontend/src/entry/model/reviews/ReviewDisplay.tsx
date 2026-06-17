import { Done, Refresh } from '@mui/icons-material'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Button, Stack, Tooltip, Typography } from '@mui/material'
import { useGetEntryRoles } from 'actions/entry'
import { postNotifyReviewer } from 'actions/review'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { Decision, ResponseInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { fromEntity } from 'utils/entityUtils'
import { getErrorMessage } from 'utils/fetcher'
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
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const dynamicRoles = useMemo(() => {
    const staticRoles = ['owner', 'contributor', 'consumer']
    return entryRoles.filter((role) => !staticRoles.includes(role.shortName))
  }, [entryRoles])

  const [errorMessage, setErrorMessage] = useState('')
  const [isNotifyButtonLoading, setIsNotifyButtonLoading] = useState(false)

  const sendNotification = useNotification()

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
      return uiConfig ? uiConfig.roleDisplayNames.owner : 'Owner'
    }
    return dynamicRoles.find((role) => role.shortName === response.role)?.name
  }

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

  if (isEntryRolesLoading || isUiConfigLoading) {
    return <Loading />
  }

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
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
