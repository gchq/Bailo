import { Button, List, ListItem, ListItemText } from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'

interface SchemaDisplayProps {
  schemaKind: string
}

export default function SchemaList({ schemaKind }: SchemaDisplayProps) {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(schemaKind)

  const schemaList = useMemo(
    () =>
      schemas.map((schema, index) => (
        <ListItem
          key={schema.id}
          divider={index + 1 !== schemas.length}
          disableGutters
          secondaryAction={
            <>
              <Button disabled>Edit</Button>
              <Button disabled>{schema.active ? 'Set as inactive' : 'Mark as active'}</Button>
            </>
          }
        >
          <ListItemText primary={schema.name} sx={{ maxWidth: 'fit-content', pr: 20 }} />
        </ListItem>
      )),
    [schemas],
  )

  const error = MultipleErrorWrapper('Unable to load schemas', {
    isSchemasError,
  })
  if (error) return error

  return (
    <>
      {isSchemasLoading && <Loading />}
      <List>{schemaList}</List>
    </>
  )
}
