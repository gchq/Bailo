import ErrorOutline from '@mui/icons-material/ErrorOutlineOutlined'
import { Button, Chip, type ChipProps, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import EntryOverviewDetails from 'src/entry/EntryOverviewDetails'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'

type ModelSelectorChipsProps = {
  label: string
  modelId: string
} & Omit<ChipProps, 'label'>

export default function ModelSelectorChip({ label, modelId, sx, ...chipProps }: ModelSelectorChipsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { entry, isEntryLoading, isEntryError, mutateEntry } = useGetModel(modelId)
  // DAs keep references to deleted models, which the API reports as 404
  const isDeleted = isEntryError?.status === 404
  const name = entry?.name ?? label

  if (isDeleted) {
    return (
      <Tooltip title='This model has been deleted'>
        <Chip
          {...chipProps}
          aria-label={`Model ${modelId} has been deleted`}
          color='error'
          icon={<ErrorOutline />}
          label={`Deleted model (${modelId})`}
          sx={{ width: 'fit-content', ...sx }}
        />
      </Tooltip>
    )
  }

  return (
    <>
      <Chip
        {...chipProps}
        aria-label={`Chip button for displaying information about model ${modelId}`}
        label={name}
        onClick={() => setIsDialogOpen(true)}
        sx={{ width: 'fit-content', ...sx }}
      />
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth>
        <DialogTitle color='primary'>{label}</DialogTitle>
        <DialogContent>
          {isEntryLoading && <Loading />}
          {isEntryError && <MessageAlert message='Unable to load model details. Please try again.' severity='error' />}
          {entry && <EntryOverviewDetails entry={entry} mutateEntry={mutateEntry} dialogView />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          <Button component={Link} href={`/model/${modelId}`} variant='contained'>
            Go to Model
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
