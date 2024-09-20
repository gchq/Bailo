import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Button,
  Card,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useListModels } from 'actions/model'
import { useGetReviewRequestsForUser } from 'actions/review'
import { deleteSchema, patchSchema, useGetSchemas } from 'actions/schema'
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryKind, SchemaInterface, SchemaKind, SchemaKindKeys } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { camelCaseToSentenceCase, camelCaseToTitleCase } from 'utils/stringUtils'

interface SchemaDisplayProps {
  schemaKind: SchemaKindKeys
}

interface ObjectToDelete {
  primary: string
  secondary: string
  link: string
}

export default function SchemaList({ schemaKind }: SchemaDisplayProps) {
  const { schemas, isSchemasLoading, isSchemasError, mutateSchemas } = useGetSchemas(schemaKind, false)
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser()

  const theme = useTheme()

  const [errorMessage, setErrorMessage] = useState('')
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
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
  const [objectsToDelete, setObjectsToDelete] = useState<ObjectToDelete[]>([])
  const [openMenuSchemaId, setOpenMenuSchemaId] = useState<SchemaInterface['id'] | null>(null)

  useEffect(() => {
    switch (schemaKind) {
      case SchemaKind.ACCESS_REQUEST:
        return setObjectsToDelete(
          reviews.map((review) => {
            return { primary: review.model.name, secondary: review.role, link: `/model/${review.model.id}?tab=access` }
          }),
        )

      case SchemaKind.DATA_CARD:
      case SchemaKind.MODEL:
        return setObjectsToDelete(
          models.map((model) => {
            return { primary: model.name, secondary: model.description, link: `/model/${model.id}` }
          }),
        )
    }
  }, [reviews, models, schemaKind])

  const handleOpenMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>, schemaId: SchemaInterface['id']) => {
      setAnchorEl(event.currentTarget)
      setOpenMenuSchemaId(schemaId)
    },
    [],
  )

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null)
    setOpenMenuSchemaId(null)
  }, [])

  const handlePatchSchema = useCallback(
    async (schemaId: SchemaInterface['id'], diff: Partial<SchemaInterface>) => {
      handleCloseMenu()
      setErrorMessage('')
      const res = await patchSchema(schemaId, diff)
      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
      } else {
        mutateSchemas()
      }
    },
    [handleCloseMenu, mutateSchemas],
  )

  const handleDeleteSchema = useCallback(
    (schemaId: string) => {
      handleCloseMenu()
      setIsConfirmationDialogOpen(true)
      setSchemaToBeDeleted(schemaId)
    },
    [handleCloseMenu],
  )

  const handleDeleteConfirm = useCallback(
    async (schemaId: string) => {
      setErrorMessage('')
      const res = await deleteSchema(schemaId)
      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
      } else {
        mutateSchemas()
        setIsConfirmationDialogOpen(false)
      }
    },
    [mutateSchemas],
  )

  const schemaList = useMemo(
    () =>
      schemas.map((schema, index) => {
        const open = !!anchorEl && openMenuSchemaId === schema.id
        return (
          <ListItem divider={index < schemas.length - 1} key={schema.id}>
            <ListItemText>{schema.name}</ListItemText>
            <Stack spacing={1} direction={{ xs: 'column', md: 'row' }} alignItems='center'>
              <Chip
                label={schema.active ? 'Active' : 'Inactive'}
                size='small'
                color={schema.active ? 'success' : 'warning'}
              />
              {schema.hidden && <Chip label='Hidden' size='small' color='error' />}
              <Button
                id={`schema-actions-button-${schema.id}`}
                size='small'
                variant='contained'
                aria-controls={open ? `schema-actions-menu-${schema.id}` : undefined}
                aria-haspopup='true'
                aria-expanded={open ? 'true' : undefined}
                endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={(event) => handleOpenMenu(event, schema.id)}
              >
                Actions
              </Button>
              <Menu
                id={`schema-actions-menu-${schema.id}`}
                open={open}
                anchorEl={anchorEl}
                MenuListProps={{
                  'aria-labelledby': `schema-actions-button-${schema.id}`,
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                onClose={handleCloseMenu}
              >
                <MenuItem onClick={() => handlePatchSchema(schema.id, { active: !schema.active })}>
                  {schema.active ? 'Mark as inactive' : 'Mark as active'}
                </MenuItem>
                <MenuItem onClick={() => handlePatchSchema(schema.id, { hidden: !schema.hidden })}>
                  {schema.hidden ? 'Mark as visible' : 'Mark as hidden'}
                </MenuItem>
                <MenuItem onClick={() => handleDeleteSchema(schema.id)}>Delete</MenuItem>
              </Menu>
            </Stack>
          </ListItem>
        )
      }),
    [schemas, openMenuSchemaId, anchorEl, handleCloseMenu, handleOpenMenu, handlePatchSchema, handleDeleteSchema],
  )

  const objectsToDeleteList = useMemo(() => {
    return objectsToDelete.map((object) => (
      <Link href={object.link} underline='none' key={object.link}>
        <ListItemButton>
          <ListItemText
            primary={object.primary}
            secondary={object.secondary}
            primaryTypographyProps={{
              sx: {
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                color: theme.palette.primary.main,
              },
            }}
            secondaryTypographyProps={{
              sx: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
            }}
          />
        </ListItemButton>
      </Link>
    ))
  }, [theme.palette.primary.main, objectsToDelete])

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  if (isModelsError) {
    return <MessageAlert message={isModelsError.info.message} severity='error' />
  }

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isReviewsLoading || isModelsLoading || isSchemasLoading) {
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
        open={isConfirmationDialogOpen}
        title='Delete schema'
        onConfirm={() => handleDeleteConfirm(schemaToBeDeleted)}
        onCancel={() => setIsConfirmationDialogOpen(false)}
        errorMessage={errorMessage}
        dialogMessage={`${models.length > 0 ? `Deleting this schema will break these ${camelCaseToSentenceCase(schemaKind)}s` : `This schema isn't currently used by any ${camelCaseToSentenceCase(schemaKind)}s`}. Are you sure you want to do this?`}
      >
        <List sx={{ maxHeight: '100%', overflow: 'auto' }}>{objectsToDeleteList}</List>
      </ConfirmationDialogue>
    </Card>
  )
}
