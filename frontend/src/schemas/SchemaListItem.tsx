import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Button, Chip, ListItem, ListItemText, Menu, MenuItem, Stack } from '@mui/material'
import { useListModels } from 'actions/model'
import { useGetSchemas } from 'actions/schema'
import { useState } from 'react'
import EditableText from 'src/common/EditableText'
import ModelListDialog from 'src/schemas/ModelListDialog'
import UpdateReviewRolesForSchemaDialog from 'src/schemas/UpdateReviewRolesForSchemaDialog'
import { EntryKind, SchemaInterface } from 'types/types'

interface SchemaListItemProps {
  schema: SchemaInterface
  schemasLength: number
  index: number
  open: boolean
  setOpenMenuSchemaId: (schemaId) => void
  anchorEl: null | HTMLElement
  onMenuClose: () => void
  onOpenMenuClick: (event, schemaId: string) => void
  onEditSchemaClick: (schemaId: string, partialSchema: Partial<SchemaInterface>) => void
  onDeleteSchemaClick: (schemaId: string) => void
}
export default function SchemaListItem({
  schema,
  schemasLength,
  index,
  open,
  setOpenMenuSchemaId,
  anchorEl,
  onMenuClose,
  onDeleteSchemaClick,
  onOpenMenuClick,
  onEditSchemaClick,
}: SchemaListItemProps) {
  const { mutateSchemas } = useGetSchemas(schema.kind)

  //TODO changes to this as blocked as no accessrequest endpoint
  const { models, isModelsLoading, isModelsError } = useListModels(
    schema.kind === 'dataCard' ? EntryKind.DATA_CARD : EntryKind.MODEL,
    [],
    '',
    [],
    [],
    [],
    '',
    undefined,
    schema.id,
  )

  const [modelsListOpen, setModelsListOpen] = useState<boolean>(false)

  const [reviewRoleSelectorIsOpen, setReviewRoleSelectorIsOpen] = useState<boolean>(false)

  const handleReviewRolesDialogClose = () => {
    mutateSchemas()
    setReviewRoleSelectorIsOpen(false)
  }

  const handleModelsListDialogClose = () => {
    setModelsListOpen(false)
  }

  return (
    <ListItem divider={index < schemasLength - 1} key={schema.id}>
      <ListItemText
        primary={
          <EditableText
            value={schema.name}
            onSubmit={(newValue: string | undefined) => onEditSchemaClick(schema.id, { name: newValue })}
            tooltipText='Edit schema name'
          />
        }
        secondary={
          <EditableText
            value={schema.description}
            onSubmit={(newValue: string | undefined) => onEditSchemaClick(schema.id, { description: newValue })}
            tooltipText='Edit schema description'
            richText
          />
        }
      />
      <Stack spacing={1} direction={{ xs: 'column', md: 'row' }} alignItems='center' sx={{ ml: 2 }}>
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
          onClick={(event) => onOpenMenuClick(event, schema.id)}
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
          onClose={onMenuClose}
          onClick={(_event) => setOpenMenuSchemaId(null)}
        >
          <MenuItem onClick={() => onEditSchemaClick(schema.id, { active: !schema.active })}>
            {schema.active ? 'Mark as inactive' : 'Mark as active'}
          </MenuItem>
          <MenuItem onClick={() => onEditSchemaClick(schema.id, { hidden: !schema.hidden })}>
            {schema.hidden ? 'Mark as visible' : 'Mark as hidden'}
          </MenuItem>
          {}
          {schema.kind !== 'accessRequest' && (
            <MenuItem onClick={() => setModelsListOpen(true)}>View schema usage</MenuItem>
          )}
          <MenuItem onClick={() => setReviewRoleSelectorIsOpen(true)}>Update review roles</MenuItem>
          <MenuItem onClick={() => onDeleteSchemaClick(schema.id)}>Delete</MenuItem>
        </Menu>
      </Stack>
      <UpdateReviewRolesForSchemaDialog
        open={reviewRoleSelectorIsOpen}
        onClose={handleReviewRolesDialogClose}
        schema={schema}
      />
      {schema.kind !== 'accessRequest' && (
        <ModelListDialog
          models={models}
          isModelsLoading={isModelsLoading}
          isModelsError={isModelsError}
          open={modelsListOpen}
          onClose={handleModelsListDialogClose}
        />
      )}
    </ListItem>
  )
}
