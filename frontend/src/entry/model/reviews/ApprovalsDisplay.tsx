import { Done } from '@mui/icons-material'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useGetModelRoles } from 'actions/model'
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
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)

  const dynamicRoles = useMemo(() => modelRoles.filter((role) => !staticRoles.includes(role._id)), [modelRoles])

  const roleApprovals = useMemo(
    () =>
      dynamicRoles.reduce<ReactElement[]>((approvals, dynamicRole) => {
        const hasRoleApproved = !!acceptedReviewResponses.find(
          (acceptedResponse) => acceptedResponse.role === dynamicRole._id,
        )
        if (hasRoleApproved) {
          approvals.push(
            <Tooltip title={`${plural(acceptedReviewResponses.length, 'review')}`} key={dynamicRole._id}>
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

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      {roleApprovals}
    </>
  )
}
