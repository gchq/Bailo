import { Typography } from '@mui/material'

import { useGetModelRoles } from '../../actions/model'
import { ReviewRequestInterface } from '../../types/interfaces'
import { getRoleDisplay } from '../../utils/beta/roles'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

type DisplayRoleProps = {
  review: ReviewRequestInterface
}

export default function ReviewRoleDisplay({ review }: DisplayRoleProps) {
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
        {`This ${review.kind} needs to be reviewed by the ${getRoleDisplay(review.role, modelRoles)}.`}
      </Typography>
    </>
  )
}
