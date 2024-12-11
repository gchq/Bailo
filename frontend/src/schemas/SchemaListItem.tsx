import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Button, Chip, ListItem, ListItemText, Menu, MenuItem, Stack } from '@mui/material'
import EditableText from 'src/common/EditableText'
import { SchemaInterface } from 'types/types'

interface SchemaListItemProps {
  schema: SchemaInterface
  schemasLength: number
  index: number
  open: boolean
  anchorEl: null | HTMLElement
  onMenuClose: () => void
  onOpenMenuClick: (event, schemaId: string) => void
  onPatchSchemaClick: (schemaId: string, partialSchema: Partial<SchemaInterface>) => void
  onDeleteSchemaClick: (schemaId: string) => void
}
export default function SchemaListItem({
  schema,
  schemasLength,
  index,
  open,
  anchorEl,
  onMenuClose,
  onDeleteSchemaClick,
  onOpenMenuClick,
  onPatchSchemaClick,
}: SchemaListItemProps) {
  return (
    <ListItem divider={index < schemasLength - 1} key={schema.id}>
      <ListItemText
        primary={
          <EditableText
            value={schema.name}
            onSubmit={(newValue) => onPatchSchemaClick(schema.id, { name: newValue })}
            tooltipText='Edit schema name'
          />
        }
        secondary={
          <EditableText
            value={schema.description}
            onSubmit={(newValue) => onPatchSchemaClick(schema.id, { description: newValue })}
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
        >
          <MenuItem onClick={() => onPatchSchemaClick(schema.id, { active: !schema.active })}>
            {schema.active ? 'Mark as inactive' : 'Mark as active'}
          </MenuItem>
          <MenuItem onClick={() => onPatchSchemaClick(schema.id, { hidden: !schema.hidden })}>
            {schema.hidden ? 'Mark as visible' : 'Mark as hidden'}
          </MenuItem>
          <MenuItem onClick={() => onDeleteSchemaClick(schema.id)}>Delete</MenuItem>
        </Menu>
      </Stack>
    </ListItem>
  )
}
