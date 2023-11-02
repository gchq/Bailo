import { Button, List, ListItem, ListItemText } from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'

interface SchemaDisplayProps {
  schemaKind: string
}

export default function SchemaList({ schemaKind }: SchemaDisplayProps) {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(schemaKind)

  const error = MultipleErrorWrapper('Unable to load schemas', {
    isSchemasError,
  })
  if (error) return error

  return (
    <>
      {isSchemasLoading && <Loading />}
      <List>
        {schemas.map((schema, index) => (
          <ListItem
            key={schema.id}
            divider={index + 1 !== schemas.length}
            secondaryAction={
              <>
                <Button disabled>Edit</Button>
                <Button>{schema.active ? 'Set as inactive' : 'Mark as active'}</Button>
              </>
            }
          >
            <ListItemText primary={schema.name} secondary={schema.description} />
          </ListItem>
        ))}
      </List>
    </>
  )
}
