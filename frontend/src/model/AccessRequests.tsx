import { Box, Button, Container, Stack } from '@mui/material'
import { useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { useMemo } from 'react'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import AccessRequestDisplay from 'src/model/accessRequests/AccessRequestDisplay'
import { sortByCreatedAtDescending } from 'utils/dateUtils'

import { ModelInterface } from '../../types/types'
import EmptyBlob from '../common/EmptyBlob'
import Loading from '../common/Loading'

type AccessRequestsProps = {
  model: ModelInterface
  roles: string[]
}

export default function AccessRequests({ model, roles }: AccessRequestsProps) {
  const { accessRequests, isAccessRequestsLoading, isAccessRequestsError } = useGetAccessRequestsForModelId(model.id)

  const accessRequestsList = useMemo(
    () =>
      accessRequests.length ? (
        accessRequests
          .sort(sortByCreatedAtDescending)
          .map((accessRequest) => (
            <AccessRequestDisplay
              accessRequest={accessRequest}
              key={accessRequest.metadata.overview.name}
              hideReviewBanner={!roles?.some((role) => ['msro', 'mtr'].includes(role))}
            />
          ))
      ) : (
        <EmptyBlob text={`No access requests found for model ${model.name}`} />
      ),
    [accessRequests, model.name, roles],
  )

  if (isAccessRequestsError) {
    return <MessageAlert message={isAccessRequestsError.info.message} severity='error' />
  }

  return (
    <Container sx={{ my: 2 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <Link href={`/model/${model.id}/access-request/schema`}>
            <Button variant='outlined' disabled={!model.card} data-test='requestAccessButton'>
              Request Access
            </Button>
          </Link>
        </Box>
        {isAccessRequestsLoading && <Loading />}
        {accessRequestsList}
      </Stack>
    </Container>
  )
}
