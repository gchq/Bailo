import { Stack, Typography } from '@mui/material'
import { useGetAccessRequestGroup } from 'actions/accessRequest'
import Loading from 'src/common/Loading'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { AccessRequestInterface } from 'types/types'

export default function AccessRequestGroupLinks({ accessRequest }: { accessRequest: AccessRequestInterface }) {
  const { accessRequests, isLoading, error } = useGetAccessRequestGroup(accessRequest)
  if (!accessRequest.groupId) {
    return null
  }
  const others = accessRequests.filter((request) => request.id !== accessRequest.id)
  return (
    <Stack spacing={1}>
      <Typography component='h2' variant='subtitle2'>
        Grouped request
      </Typography>
      <Typography variant='body2'>
        Each model is reviewed separately. Only requests you can view are listed below.
      </Typography>
      {isLoading && <Loading />}
      {error && <MessageAlert message='Related access requests could not be loaded.' severity='warning' />}
      {!isLoading && !error && others.length === 0 && (
        <Typography variant='body2'>No other requests in this group are visible to you.</Typography>
      )}
      {others.map((request) => (
        <Link key={request.id} href={`/model/${request.modelId}/access-request/${request.id}`}>
          Request for {request.modelId}
        </Link>
      ))}
    </Stack>
  )
}
