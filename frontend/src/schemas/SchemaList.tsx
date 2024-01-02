import { Button, List, ListItem, ListItemText } from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

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

  if (isSchemasLoading) {
    return <Loading />
  }

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  return <List>{schemaList}</List>
}
