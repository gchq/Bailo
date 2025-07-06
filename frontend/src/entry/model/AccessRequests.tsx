import { Box, Button, Container, Stack } from '@mui/material'
import { useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { memoize } from 'lodash-es'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import AccessRequestDisplay from 'src/entry/model/accessRequests/AccessRequestDisplay'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { hasRole } from 'utils/roles'

type AccessRequestsProps = {
  model: EntryInterface
  currentUserRoles: string[]
}

export default function AccessRequests({ model, currentUserRoles }: AccessRequestsProps) {
  const { accessRequests, isAccessRequestsLoading, isAccessRequestsError } = useGetAccessRequestsForModelId(model.id)

  const AccessRequestListItem = memoize(({ data, index }) => (
    <AccessRequestDisplay
      accessRequest={data[index]}
      key={data[index].metadata.overview.name}
      hideReviewBanner={!hasRole(currentUserRoles, ['msro'])}
    />
  ))

  if (isAccessRequestsLoading) {
    return <Loading />
  }

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
        <Paginate
          list={accessRequests.map((entryFile) => {
            return { key: entryFile._id, ...entryFile }
          })}
          emptyListText={`No access requests found for model ${model.name}`}
          sortingProperties={[
            { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
            { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
          ]}
          searchPlaceholderText='Search by user'
          defaultSortProperty='createdAt'
          searchFilterProperty='createdBy'
        >
          {AccessRequestListItem}
        </Paginate>
      </Stack>
    </Container>
  )
}
