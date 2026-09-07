import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MenuIcon from '@mui/icons-material/Menu'
import { Button, Chip, ListItem, Menu, MenuItem, Stack } from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import { useState } from 'react'
import EditableText from 'src/common/EditableText'
import LabelledValue from 'src/common/LabelledValue'
import UpdateReviewRolesForSchemaDialog from 'src/schemas/UpdateReviewRolesForSchemaDialog'
import UsageListDialog from 'src/schemas/UsageListDialog'
import { SchemaInterface, SchemaKind } from 'types/types'

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

  const [entriesListOpen, setEntriesListOpen] = useState<boolean>(false)

  const [reviewRoleSelectorIsOpen, setReviewRoleSelectorIsOpen] = useState<boolean>(false)

  const handleReviewRolesDialogClose = () => {
    mutateSchemas()
    setReviewRoleSelectorIsOpen(false)
  }

  const handleEntriesListDialogClose = () => {
    setEntriesListOpen(false)
  }

  return (
    <ListItem divider={index < schemasLength - 1} key={schema.id}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          width: '100%',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
        }}
      >
        <Stack spacing={2} sx={{ width: '100%' }}>
          <LabelledValue label='ID' value={schema.id} />
          <EditableText
            label='Name'
            value={schema.name}
            onSubmit={(newValue: string | undefined) => onEditSchemaClick(schema.id, { name: newValue })}
            tooltipText='Edit schema name'
          />
          <EditableText
            label='Description'
            value={schema.description}
            onSubmit={(newValue: string | undefined) => onEditSchemaClick(schema.id, { description: newValue })}
            tooltipText='Edit schema description'
            richText
          />
        </Stack>
        <Stack
          spacing={1}
          direction={{ xs: 'column', md: 'row' }}
          sx={{
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
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
            startIcon={<MenuIcon />}
          >
            Actions
          </Button>
          <Menu
            id={`schema-actions-menu-${schema.id}`}
            open={open}
            anchorEl={anchorEl}
            slotProps={{
              list: {
                'aria-label': `schema-actions-button-${schema.id}`,
              },
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
            <MenuItem
              disabled={schema.kind === SchemaKind.DEPLOYMENT_ASSESSMENT}
              onClick={() => setEntriesListOpen(true)}
            >
              View schema usage
            </MenuItem>
            <MenuItem
              disabled={schema.kind === SchemaKind.DEPLOYMENT_ASSESSMENT}
              onClick={() => setReviewRoleSelectorIsOpen(true)}
            >
              Update review roles
            </MenuItem>
            <MenuItem onClick={() => onDeleteSchemaClick(schema.id)}>Delete</MenuItem>
          </Menu>
        </Stack>
      </Stack>
      <UpdateReviewRolesForSchemaDialog
        open={reviewRoleSelectorIsOpen}
        onClose={handleReviewRolesDialogClose}
        schema={schema}
      />
      {schema.kind !== SchemaKind.DEPLOYMENT_ASSESSMENT && (
        <UsageListDialog open={entriesListOpen} schema={schema} onClose={handleEntriesListDialogClose} />
      )}
    </ListItem>
  )
}
