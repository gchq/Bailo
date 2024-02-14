import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { Stack, Typography } from '@mui/material'
import { ReviewRequestInterface } from 'types/v2/types'

import { useGetModelRoles } from '../../actions/model'
import { getRoleDisplay } from '../../utils/roles'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

type ReviewRoleDisplayProps = {
  review: ReviewRequestInterface
}

export default function ReviewRoleDisplay({ review }: ReviewRoleDisplayProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(review.model.id)

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  if (review.responses.length > 0) {
    return <></>
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
        <NotificationsNoneOutlinedIcon sx={{ fontSize: 'medium' }} color='warning' />
        <Typography variant='subtitle2' sx={{ fontStyle: 'italic' }}>
          {`This ${review.kind} needs to be reviewed by the ${getRoleDisplay(review.role, modelRoles)}.`}
        </Typography>
      </Stack>
    </>
  )
}
