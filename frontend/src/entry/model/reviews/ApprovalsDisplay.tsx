import { Done, ErrorOutline } from '@mui/icons-material'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useGetModelRoles } from 'actions/model'
import { ReactElement, useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { ResponseInterface } from 'types/types'
import { isFinalised } from 'utils/reviewUtils'
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

  const dynamicRoles = useMemo(() => modelRoles.filter((role) => !staticRoles.includes(role.id)), [modelRoles])

  const roleApprovals = useMemo(
    () =>
      dynamicRoles.reduce<ReactElement[]>((decisions, dynamicRole) => {
        const finalisedDecisions = acceptedReviewResponses.filter(
          (r) => isFinalised(r.decision) && r.role === dynamicRole.id,
        )
        const latestDecision = finalisedDecisions.at(0)
        if (!latestDecision || !latestDecision.decision) {
          return decisions
        }

        if (latestDecision.decision === 'approve') {
          decisions.push(
            <Tooltip title={`${plural(acceptedReviewResponses.length, 'review')}`} key={dynamicRole.id}>
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
        if (latestDecision.decision === 'deny') {
          decisions.push(
            <Tooltip title={`${plural(acceptedReviewResponses.length, 'review')}`} key={dynamicRole.id}>
              <Stack direction='row'>
                <ErrorOutline color='error' fontSize='small' />
                <Typography variant='caption'>
                  {showCurrentUserResponses
                    ? `You have denied this as a ${dynamicRole.name}`
                    : `Denied by ${dynamicRole.name}`}
                </Typography>
              </Stack>
            </Tooltip>,
          )
        }
        return decisions
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
