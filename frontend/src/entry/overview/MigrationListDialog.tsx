import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useGetModel } from 'actions/model'
import { postRunSchemaMigration } from 'actions/schemaMigration'
import { useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import { Transition } from 'src/common/Transition'
import { EntryInterface, SchemaMigrationInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type MigrationListDialogProps = {
  open: boolean
  migrations: SchemaMigrationInterface[]
  onCancel: () => void
  entry: EntryInterface
}

export default function MigrationListDialog({ open, migrations, onCancel, entry }: MigrationListDialogProps) {
  const [selectedMigrationPlan, setSelectMigrationPlan] = useState<string | undefined>()
  const [errorText, setErrorText] = useState('')

  const { mutateModel } = useGetModel(entry.id, entry.kind)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectMigrationPlan((event.target as HTMLInputElement).value)
  }

  const handleMigrationConfirm = async () => {
    setErrorText('')
    if (!selectedMigrationPlan) {
      return setErrorText('Invalid schema migration plan selected')
    }
    const res = await postRunSchemaMigration(entry.id, selectedMigrationPlan)
    if (!res.ok) {
      setErrorText(await getErrorMessage(res))
    } else {
      mutateModel()
      onCancel()
    }
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
      <FormControlLabel key={migration.id} value={migration.id} control={<Radio />} label={migration.name} />
    ))
  }, [migrations])

  return (
    <Dialog fullWidth open={open} onClose={onCancel} TransitionComponent={Transition}>
      <DialogTitle>Select a migration</DialogTitle>
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
        <Button variant='contained' onClick={() => handleMigrationConfirm()} autoFocus data-test='confirmButton'>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
