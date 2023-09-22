import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { ApprovalStates } from '../../../../types/v2/enums'
import { ReviewRequestInterface } from '../../../../types/interfaces'
import { getRoleDisplay } from '../../../../utils/beta/roles'
import { Stack, Typography } from '@mui/material'
import { useGetModelRoles } from '../../../../actions/model'
import MessageAlert from '../../../MessageAlert'
import Loading from '../../../common/Loading'

interface ModelReleaseReviewDisplayProps {
  review: ReviewRequestInterface
}

export default function ModelReleaseReviewDisplay({ review }: ModelReleaseReviewDisplayProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(review.model.id)

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }
  return (
    <>
      {isModelRolesLoading && <Loading />}
      <Stack direction={{ sm: 'row', xs: 'column' }}>
        {review.responses.map((response) => {
          const [_kind, username] = response.user.split(':')
          switch (response.decision) {
            case ApprovalStates.Accepted:
              return (
                <Stack direction='row' spacing={1}>
                  <Done color='success' fontSize='small' />
                  <Typography variant='caption'>
                    <span style={{ fontWeight: 'bold' }}>{username}</span>
                    {` has approved this release (${getRoleDisplay(review.role, modelRoles)})`}
                  </Typography>
                </Stack>
              )
            case ApprovalStates.RequestChanges:
              return (
                <Stack direction='row' spacing={1}>
                  <HourglassEmpty color='warning' fontSize='small' />
                  <Typography variant='caption'>
                    <span style={{ fontWeight: 'bold' }}>{username}</span>
                    {` has requested changes for this release (${getRoleDisplay(review.role, modelRoles)})`}
                  </Typography>
                </Stack>
              )
          }
        })}
      </Stack>
    </>
  )
}
