import Create from '@mui/icons-material/Create'
import { Box, Button, Container, Stack } from '@mui/material'
import { useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { memoize } from 'lodash-es'
import Paginate from 'src/common/Paginate'
import renderQueryState from 'src/common/renderQueryState'
import AccessRequestDisplay from 'src/entry/model/accessRequests/AccessRequestDisplay'
import Link from 'src/Link'
import { EntryInterface } from 'types/types'

type AccessRequestsProps = {
  model: EntryInterface
}

export default function AccessRequests({ model }: AccessRequestsProps) {
  const { accessRequests, isAccessRequestsLoading, isAccessRequestsError } = useGetAccessRequestsForModelId(model.id)

  const AccessRequestListItem = memoize(({ data }) => (
    <AccessRequestDisplay accessRequest={data} key={data.metadata.overview.name} />
  ))

  const queryState = renderQueryState([isAccessRequestsError], isAccessRequestsLoading)
  if (queryState) {
    return queryState
  }

  return (
    <Container sx={{ my: 2 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <Link href={`/model/${model.id}/access-request/schema`}>
            <Button variant='outlined' disabled={!model.card} data-test='requestAccessButton' startIcon={<Create />}>
              Request access
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
