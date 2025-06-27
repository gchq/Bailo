import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { Stack, Typography } from '@mui/material'
import { useGetResponses } from 'actions/response'
import { useGetUiConfig } from 'actions/uiConfig'
import { ReviewRequestInterface } from 'types/types'

import { useGetModelRoles } from '../../actions/model'
import { getRoleDisplayName } from '../../utils/roles'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

type ReviewRoleDisplayProps = {
  review: ReviewRequestInterface
}

export default function ReviewRoleDisplay({ review }: ReviewRoleDisplayProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(review.model.id)
  const { responses, isResponsesLoading, isResponsesError } = useGetResponses([review._id])
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  if (isResponsesError) {
    return <MessageAlert message={isResponsesError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (responses.length > 0) {
    return <></>
  }

  return (
    <>
      {(isModelRolesLoading || isResponsesLoading || isUiConfigLoading) && <Loading />}
      <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
        <NotificationsNoneOutlinedIcon sx={{ fontSize: 'medium' }} color='warning' />
        {uiConfig && (
          <Typography variant='subtitle2' sx={{ fontStyle: 'italic' }}>
            {`This ${review.kind} needs to be reviewed by the ${getRoleDisplayName(review.role, modelRoles, uiConfig)}.`}
          </Typography>
        )}
      </Stack>
    </>
  )
}
