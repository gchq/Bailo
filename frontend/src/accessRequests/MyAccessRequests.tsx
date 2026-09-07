import { Container, Stack, Typography } from '@mui/material'
import { useGetAccessRequests } from 'actions/accessRequest'
import { useGetModel } from 'actions/entry'
import { memoize } from 'lodash-es'
import Paginate from 'src/common/Paginate'
import renderQueryState from 'src/common/renderQueryState'
import AccessRequestDisplay from 'src/entry/model/accessRequests/AccessRequestDisplay'
import Link from 'src/Link'
import { AccessRequestInterface } from 'types/types'

type AccessRequestListItem = AccessRequestInterface & {
  key: string
  searchText: string
}

function AccessRequestWithModel({ accessRequest }: { accessRequest: AccessRequestInterface }) {
  const { entry, isEntryLoading, isEntryError } = useGetModel(accessRequest.modelId)
  const modelLabel = entry?.name ?? accessRequest.modelId

  return (
    <Stack spacing={1}>
      <Typography variant='subtitle2'>
        Model:{' '}
        {isEntryLoading || isEntryError || !entry ? (
          modelLabel
        ) : (
          <Link href={`/model/${accessRequest.modelId}`}>{modelLabel}</Link>
        )}
      </Typography>
      <AccessRequestDisplay accessRequest={accessRequest} />
    </Stack>
  )
}

export default function MyAccessRequests() {
  const { accessRequests, isAccessRequestsLoading, isAccessRequestsError } = useGetAccessRequests([], '', true)

  const queryState = renderQueryState([isAccessRequestsError], isAccessRequestsLoading)
  if (queryState) {
    return queryState
  }

  const list: AccessRequestListItem[] = accessRequests.map((accessRequest) => ({
    ...accessRequest,
    key: accessRequest.id,
    searchText: [accessRequest.metadata.overview.name, accessRequest.modelId, accessRequest.createdBy].join(' '),
  }))

  const AccessRequestListRow = memoize(({ data }: { data: AccessRequestListItem }) => (
    <AccessRequestWithModel accessRequest={data} />
  ))

  return (
    <Container maxWidth='lg' sx={{ my: 2 }}>
      <Paginate
        list={list}
        emptyListText='No access requests found for your account'
        sortingProperties={[
          { value: 'createdAt', title: 'Date created', iconKind: 'date' },
          { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
        ]}
        searchPlaceholderText='Search access requests'
        defaultSortProperty='updatedAt'
        searchFilterProperty='searchText'
      >
        {AccessRequestListRow}
      </Paginate>
    </Container>
  )
}
