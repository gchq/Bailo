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

export function DeletedModelChip({ modelId, size, sx, ...chipProps }: Omit<ChipProps, 'label'> & { modelId: string }) {
  return (
    <Tooltip title={`This model (${modelId}) has been deleted.`}>
      <Chip
        {...chipProps}
        size={size}
        aria-label={modelId}
        color='error'
        icon={<ErrorOutline />}
        label={modelId}
        sx={{
          ...sx,
          width: 'fit-content',
          maxWidth: 'none',
          height: 'auto',
          minHeight: size === 'small' ? 24 : 32,
          '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere', py: 0.25 },
        }}
      />
    </Tooltip>
  )
}

export default function ModelSelectorChip({ label, modelId, sx, ...chipProps }: ModelSelectorChipsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { entry, isEntryLoading, isEntryError, mutateEntry } = useGetModel(modelId)
  const isDeleted = isEntryError?.status === 404
  const name = entry?.name ?? label

  if (isDeleted) {
    return <DeletedModelChip {...chipProps} sx={sx} modelId={modelId} />
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
