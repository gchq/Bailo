import { Done } from '@mui/icons-material'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useGetModelRoles } from 'actions/model'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { ReviewResponseWithRole } from 'types/interfaces'
import { plural } from 'utils/stringUtils'

interface ApprovalsDisplayProps {
  modelId: string
  acceptedReviewResponses: ReviewResponseWithRole[]
}

export default function ApprovalsDisplay({ modelId, acceptedReviewResponses }: ApprovalsDisplayProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)

  const roleApprovals = useMemo(() => {
    const staticRoles = ['owner', 'contributor', 'consumer']
    const dynamicRoles = modelRoles.filter((role) => !staticRoles.includes(role.id)).map((role) => role)
    return dynamicRoles.map((dynamicRole) => {
      const acceptedResponsesForRole = acceptedReviewResponses.filter(
        (acceptedResponse) => acceptedResponse.role === dynamicRole.id,
      )
      if (acceptedResponsesForRole.length > 0) {
        return (
          <>
            <Tooltip title={`${plural(acceptedReviewResponses.length, 'approval')}`} key={dynamicRole.id}>
              <Stack direction='row'>
                <Done color='success' fontSize='small' />
                <Typography variant='caption'>{`Approved by ${dynamicRole.name}`}</Typography>
              </Stack>
            </Tooltip>
          </>
        )
      }
    })
  }, [acceptedReviewResponses, modelRoles])

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
