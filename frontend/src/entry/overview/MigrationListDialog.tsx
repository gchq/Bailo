import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormLabel,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  RadioGroup,
  Typography,
} from '@mui/material'
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectMigrationPlan((event.target as HTMLInputElement).value)
  }

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
              slotProps={{ input: { 'aria-labelledby': `Schema migration plan ${migration.name}` } }}
            />
          </ListItemIcon>
          <ListItemText primary={migration.name} secondary={migration.description} />
        </ListItemButton>
      </ListItem>
    ))
  }, [migrations, setSelectMigrationPlan, selectedMigrationPlan])

  return (
    <Dialog fullWidth open={open} onClose={onCancel} slots={{ transition: Transition }}>
      <DialogTitle color='primary'>Select a Migration</DialogTitle>
      <Divider flexItem />
      <DialogContent>
        <FormControl sx={{ width: '100%' }}>
          <FormLabel id='migration-plan-selector'>Plans</FormLabel>
          <RadioGroup
            aria-labelledby='migration-plan-selector'
            name='migration-plan-selector-group'
            value={selectedMigrationPlan}
            onChange={handleChange}
          >
            {migrationList}
          </RadioGroup>
        </FormControl>
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
