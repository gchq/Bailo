import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { useGetSchemaMigrations } from 'actions/schemaMigration'
import { memoize } from 'lodash-es'
import Link from 'next/link'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import MessageAlert from 'src/MessageAlert'
import { formatDateString } from 'utils/dateUtils'

export default function SchemaMigrationList() {
  const { schemaMigrations, isSchemaMigrationsLoading, isSchemaMigrationsError } = useGetSchemaMigrations()

  const SchemaMigrationList = memoize(({ data, index }) => (
    <Stack sx={{ p: 2 }}>
      <Stack direction='row' spacing={2} justifyContent='space-between'>
        <Typography fontWeight='bold' color='primary'>
          {data[index].name}
        </Typography>
        <Typography>
          Created on <span style={{ fontWeight: 'bold' }}>{formatDateString(data[index].createdAt)}</span>
        </Typography>
      </Stack>
      <Typography variant='caption'>{`Plan for migrating ${data[index].sourceSchema} to ${data[index].targetSchema}`}</Typography>
    </Stack>
  ))

  if (isSchemaMigrationsError) {
    return <MessageAlert message={isSchemaMigrationsError.info.message} severity='error' />
  }

  if (isSchemaMigrationsLoading) {
    return <Loading />
  }
  return (
    <Container sx={{ my: 2 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <Link href={`/schemas/migrations/new`}>
            <Button variant='outlined' data-test='createNewSchemaMigration'>
              New Schema Migration Plan
            </Button>
          </Link>
        </Box>
        <Paginate
          list={schemaMigrations.map((migration) => {
            return { key: migration.name, ...migration }
          })}
          emptyListText={'No schema migration plans available'}
          sortingProperties={[
            { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
            { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
          ]}
          searchPlaceholderText='Search by name'
          defaultSortProperty='createdAt'
          searchFilterProperty='name'
        >
          {SchemaMigrationList}
        </Paginate>
      </Stack>
    </Container>
  )
}
