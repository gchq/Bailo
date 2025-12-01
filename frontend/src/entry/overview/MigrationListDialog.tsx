import { Box, Checkbox, Divider, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import { Transition } from 'src/common/Transition'
import { SchemaMigrationInterface } from 'types/types'

type MigrationListDialogProps = {
  open: boolean
  migrations: SchemaMigrationInterface[]
  onCancel: () => void
  errorText?: string
  onConfirmation: (migrationPlanId: string) => Promise<void>
}

export default function MigrationListDialog({
  open,
  migrations,
  onCancel,
  errorText,
  onConfirmation,
}: MigrationListDialogProps) {
  const [selectedMigrationPlan, setSelectMigrationPlan] = useState<SchemaMigrationInterface['id'] | undefined>()

  const migrationList = useMemo(() => {
    if (migrations.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <EmptyBlob text='No migration plans found' />
        </Box>
      )
    }

    return migrations.map((migration) => (
      <ListItem key={migration.id} disablePadding>
        <ListItemButton role={undefined} onClick={() => setSelectMigrationPlan(migration.id)} dense>
          <ListItemIcon>
            <Checkbox
              edge='start'
              checked={selectedMigrationPlan === migration.id}
              tabIndex={-1}
              disableRipple
              value={selectedMigrationPlan}
              slotProps={{ input: { 'aria-label': `Schema migration plan ${migration.name}` } }}
            />
          </ListItemIcon>
          <ListItemText primary={migration.name} secondary={migration.description} />
        </ListItemButton>
      </ListItem>
    ))
  }, [migrations, setSelectMigrationPlan, selectedMigrationPlan])

  return (
    <Dialog fullWidth open={open} onClose={onCancel} slots={{ transition: Transition }}>
      <DialogTitle color='primary'>Select a Migration Plan</DialogTitle>
      <Divider flexItem />
      <DialogContent>
        {migrationList}
        <Typography variant='caption' color='error'>
          {errorText}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' variant='outlined' onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!selectedMigrationPlan}
          variant='contained'
          onClick={() => onConfirmation(selectedMigrationPlan as string)}
          autoFocus
          data-test='confirmButton'
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
