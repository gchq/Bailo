import { Done } from '@mui/icons-material'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useGetEntryRoles } from 'actions/model'
import { ReactElement, useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { ResponseInterface } from 'types/types'
import { plural } from 'utils/stringUtils'

interface ApprovalsDisplayProps {
  modelId: string
  acceptedReviewResponses: ResponseInterface[]
  showCurrentUserResponses?: boolean
}

const staticRoles = ['owner', 'contributor', 'consumer']

export default function ApprovalsDisplay({
  modelId,
  acceptedReviewResponses,
  showCurrentUserResponses = false,
}: ApprovalsDisplayProps) {
  const {
    entryRoles: entryRoles,
    isEntryRolesLoading: isEntryRolesLoading,
    isEntryRolesError: isEntryRolesError,
  } = useGetEntryRoles(modelId)

  const dynamicRoles = useMemo(() => entryRoles.filter((role) => !staticRoles.includes(role.shortName)), [entryRoles])

  const roleApprovals = useMemo(
    () =>
      dynamicRoles.reduce<ReactElement[]>((approvals, dynamicRole) => {
        const hasRoleApproved = !!acceptedReviewResponses.find(
          (acceptedResponse) => acceptedResponse.role === dynamicRole.shortName,
        )
        if (hasRoleApproved) {
          approvals.push(
            <Tooltip title={`${plural(acceptedReviewResponses.length, 'review')}`} key={dynamicRole.shortName}>
              <Stack direction='row'>
                <Done color='success' fontSize='small' />
                <Typography variant='caption'>
                  {showCurrentUserResponses
                    ? `You have approved this as a ${dynamicRole.name}`
                    : `Approved by ${dynamicRole.name}`}
                </Typography>
              </Stack>
            </Tooltip>,
          )
        }
        return approvals
      }, []),
    [acceptedReviewResponses, dynamicRoles, showCurrentUserResponses],
  )

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isEntryRolesLoading && <Loading />}
      {roleApprovals}
    </>
  )
}
