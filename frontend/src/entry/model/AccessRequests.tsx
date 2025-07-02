import { Box, Button, Container, Stack } from '@mui/material'
import { useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { useGetReviewRoles } from 'actions/reviewRoles'
import { useGetSchemas } from 'actions/schema'
import { memoize } from 'lodash-es'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import AccessRequestDisplay from 'src/entry/model/accessRequests/AccessRequestDisplay'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, SchemaKind } from 'types/types'
import { hasRole } from 'utils/roles'

type AccessRequestsProps = {
  model: EntryInterface
  currentUserRoles: string[]
}

export default function AccessRequests({ model, currentUserRoles }: AccessRequestsProps) {
  const { accessRequests, isAccessRequestsLoading, isAccessRequestsError } = useGetAccessRequestsForModelId(model.id)
  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles()
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.ACCESS_REQUEST)

  const AccessRequestListItem = memoize(({ data, index }) => (
    <AccessRequestDisplay
      accessRequest={data[index]}
      key={data[index].metadata.overview.name}
      hideReviewBanner={
        !hasRole(
          currentUserRoles,
          reviewRoles
            .filter((role) => {
              const accessRequestSchema = schemas.find((schema) => schema.id === data[index].schemaId)
              if (accessRequestSchema && accessRequestSchema.reviewRoles) {
                return accessRequestSchema.reviewRoles.includes(role.short)
              } else {
                return
              }
            })
            .map((role) => role.short),
        )
      }
    />
  ))

  if (isAccessRequestsLoading || isReviewRolesLoading || isSchemasLoading) {
    return <Loading />
  }

  if (isAccessRequestsError) {
    return <MessageAlert message={isAccessRequestsError.info.message} severity='error' />
  }

  if (isReviewRolesError) {
    return <MessageAlert message={isReviewRolesError.info.message} severity='error' />
  }

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
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
