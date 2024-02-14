import { Button, List, Stack, Typography } from '@mui/material'
import { deleteSchema, patchSchema, useGetSchemas } from 'actions/schema'
import { useCallback, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { SchemaInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface SchemaDisplayProps {
  schemaKind: string
}

export default function SchemaList({ schemaKind }: SchemaDisplayProps) {
  const { schemas, isSchemasLoading, isSchemasError, mutateSchemas } = useGetSchemas(schemaKind)

  const [errorMessage, setErrorMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [schemaToBeDeleted, setSchemaToBeDeleted] = useState('')

  const handleSetSchemaActive = useCallback(
    async (schema: SchemaInterface) => {
      setErrorMessage('')
      const updatedSchema = { ...schema, active: !schema.active }
      const res = await patchSchema(updatedSchema.id, { active: updatedSchema.active })
      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
      } else {
        mutateSchemas()
      }
    },
    [mutateSchemas],
  )

  const handleDeleteSchemaButtonOnClick = useCallback((schemaId: string) => {
    setOpen(true)
    setSchemaToBeDeleted(schemaId)
  }, [])

  const handleDeleteConfirm = useCallback(
    async (schemaId: string) => {
      setErrorMessage('')
      const res = await deleteSchema(schemaId)
      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
      } else {
        mutateSchemas()
        setOpen(false)
      }
    },
    [mutateSchemas],
  )

  const schemaList = useMemo(() => {
    return schemas.map((schema) => (
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems='center' justifyContent='space-between' key={schema.id}>
        <Typography>{schema.name}</Typography>
        <Stack spacing={1} direction={{ xs: 'column', md: 'row' }}>
          <Button variant='outlined' onClick={() => handleSetSchemaActive(schema)}>
            {schema.active ? 'Mark as inactive' : 'Mark as active'}
          </Button>
          <Button variant='contained' onClick={() => handleDeleteSchemaButtonOnClick(schema.id)}>
            Delete
          </Button>
        </Stack>
        <MessageAlert message={errorMessage} severity='error' />
        <ConfirmationDialogue
          open={open}
          title='Delete schema'
          onConfirm={() => handleDeleteConfirm(schemaToBeDeleted)}
          onCancel={() => setOpen(false)}
          errorMessage={errorMessage}
          dialogMessage={
            'Deleting this schema will break any existing models that are using it. Are you sure you want to do this?'
          }
        />
      </Stack>
    ))
  }, [
    schemas,
    errorMessage,
    open,
    schemaToBeDeleted,
    handleDeleteConfirm,
    handleDeleteSchemaButtonOnClick,
    handleSetSchemaActive,
  ])

  if (isSchemasLoading) {
    return <Loading />
  }

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  return (
    <>
      <List>{schemaList}</List>
      {schemas.length == 0 && <EmptyBlob text='No schemas to show' />}
    </>
  )
}
