import { Box, Stack } from '@mui/material'
import { useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { useMemo } from 'react'
import MessageAlert from 'src/MessageAlert'
import AccessRequestDisplay from 'src/model/beta/accessRequests/AccessRequestDisplay'

import { ModelInterface } from '../../../types/v2/types'
import EmptyBlob from '../../common/EmptyBlob'
import Loading from '../../common/Loading'

type AccessRequestsProps = {
  model: ModelInterface
}

export default function AccessRequests({ model }: AccessRequestsProps) {
  const { accessRequests, isAccessRequestsLoading, isAccessRequestsError } = useGetAccessRequestsForModelId(model.id)

  const accessRequestsList = useMemo(
    () =>
      accessRequests.length ? (
        accessRequests.map((accessRequest) => (
          <AccessRequestDisplay accessRequest={accessRequest} key={accessRequest.metadata.overview.name} />
        ))
      ) : (
        <EmptyBlob text={`No access requests found for model ${model.name}`} />
      ),
    [accessRequests, model.name],
  )

  // TODO me - Check this works once the above endpoint is live
  if (isAccessRequestsError) {
    return <MessageAlert message={isAccessRequestsError.info.message} severity='error' />
  }

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', my: 4 }}>
      <Stack spacing={4}>
        {isAccessRequestsLoading && <Loading />}
        {accessRequestsList}
      </Stack>
    </Box>
  )
}
