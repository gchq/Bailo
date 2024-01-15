import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { Typography } from '@mui/material'

import { useGetModelRoles } from '../../actions/model'
import { ReviewRequestInterface } from '../../types/interfaces'
import { getRoleDisplay } from '../../utils/beta/roles'
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
      <Typography variant='subtitle2' sx={{ fontStyle: 'italic' }}>
        <NotificationsNoneOutlinedIcon sx={{ fontSize: 'small', mr: 1 }} color='warning' />
        {`This ${review.kind} needs to be reviewed by the ${getRoleDisplay(review.role, modelRoles)}.`}
      </Typography>
    </>
  )
}
