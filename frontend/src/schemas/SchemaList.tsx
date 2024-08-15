import { Button, Card, Link, List, ListItem, ListItemButton, ListItemText, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useListModels } from 'actions/model'
import { deleteSchema, patchSchema, useGetSchemas } from 'actions/schema'
import { useCallback, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { EntryKind, SchemaInterface, SchemaKind, SchemaKindKeys } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { camelCaseToTitleCase } from 'utils/stringUtils'

interface SchemaDisplayProps {
  schemaKind: SchemaKindKeys
}

export default function SchemaList({ schemaKind }: SchemaDisplayProps) {
  const { schemas, isSchemasLoading, isSchemasError, mutateSchemas } = useGetSchemas(schemaKind)

  const theme = useTheme()

  const [errorMessage, setErrorMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [schemaToBeDeleted, setSchemaToBeDeleted] = useState('')
  const { models, isModelsLoading, isModelsError } = useListModels(
    schemaKind === SchemaKind.MODEL ? EntryKind.MODEL : EntryKind.DATA_CARD,
    [],
    '',
    [],
    '',
    false,
    schemaToBeDeleted,
  )

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

  const schemaList = useMemo(
    () =>
      schemas.map((schema, index) => (
        <ListItem divider={index < schemas.length - 1} key={schema.id}>
          <ListItemText>{schema.name}</ListItemText>
          <Stack spacing={1} direction={{ xs: 'column', md: 'row' }}>
            <Button size='small' variant='outlined' onClick={() => handleSetSchemaActive(schema)}>
              {schema.active ? 'Mark as inactive' : 'Mark as active'}
            </Button>
            <Button size='small' variant='contained' onClick={() => handleDeleteSchemaButtonOnClick(schema.id)}>
              Delete
            </Button>
          </Stack>
        </ListItem>
      )),
    [schemas, handleDeleteSchemaButtonOnClick, handleSetSchemaActive],
  )

  if (isSchemasLoading) {
    return <Loading />
  }

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  if (isModelsError) {
    return <MessageAlert message={isModelsError.info.message} severity='error' />
  }

  if (isModelsLoading) {
    return <Loading />
  }

  return (
    <Card sx={{ p: 2 }}>
      <Typography color='primary' variant='h6' component='h2'>
        {`${camelCaseToTitleCase(schemaKind)} Schemas`}
      </Typography>
      <MessageAlert message={errorMessage} severity='error' />
      <List>{schemaList}</List>
      {schemas.length == 0 && <EmptyBlob text='No schemas to show' />}
      <ConfirmationDialogue
        open={open}
        title='Delete schema'
        onConfirm={() => handleDeleteConfirm(schemaToBeDeleted)}
        onCancel={() => setOpen(false)}
        errorMessage={errorMessage}
        dialogMessage={`${models.length > 0 ? 'Deleting this schema will break these models' : "This schema isn't used by any models currently"}. Are you sure you want to do this?`}
      >
        <List sx={{ maxHeight: '100%', overflow: 'auto' }}>
          {models.map((model) => (
            <Link href={`/model/${model.id}`} underline='none' key={model.id}>
              <ListItemButton>
                <ListItemText
                  primary={model.name}
                  secondary={model.description}
                  primaryTypographyProps={{
                    style: {
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      color: theme.palette.primary.main,
                    },
                  }}
                  secondaryTypographyProps={{
                    style: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
                  }}
                />
              </ListItemButton>
            </Link>
          ))}
        </List>
      </ConfirmationDialogue>
    </Card>
  )
}
