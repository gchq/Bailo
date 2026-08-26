import { Box, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import AssociatedReleasesList from 'src/entry/model/releases/AssociatedReleasesList'
import { FileInterface, ReleaseInterface } from 'types/types'
import { plural } from 'utils/stringUtils'

interface DeleteConfirmationDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  confirmLoading?: boolean
  errorMessage?: string
  itemName: string
  itemType: 'file' | 'folder'
  associatedReleases: ReleaseInterface[]
  allReleases: ReleaseInterface[]
  modelId: string
  filesToDelete?: FileInterface[]
}

export default function DeleteConfirmationDialog({
  open,
  onConfirm,
  onCancel,
  confirmLoading,
  errorMessage,
  itemName,
  itemType,
  associatedReleases,
  allReleases,
  modelId,
  filesToDelete = [],
}: DeleteConfirmationDialogProps) {
  const latestRelease = useMemo(() => (allReleases.length > 0 ? allReleases[0].semver : ''), [allReleases])

  return (
    <ConfirmationDialogue
      open={open}
      title={`Delete ${itemType} "${itemName}"?`}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      errorMessage={errorMessage}
    >
      <Stack spacing={1}>
        {itemType === 'folder' && (
          <Typography>
            {filesToDelete.length > 0 ? (
              <>
                This will delete <strong>{plural(filesToDelete.length, 'file')}</strong> in this folder and all
                sub-folders.
              </>
            ) : (
              'This will delete this empty folder.'
            )}
          </Typography>
        )}
        {associatedReleases.length > 0 ? (
          <>
            <Typography color='error'>
              Warning: Deleting will affect {plural(associatedReleases.length, 'release')}:
            </Typography>
            <AssociatedReleasesList modelId={modelId} latestRelease={latestRelease} releases={associatedReleases} />
          </>
        ) : (
          <Typography>This will not affect any existing releases.</Typography>
        )}
        {itemType === 'folder' && filesToDelete.length > 0 && (
          <>
            <Typography variant='caption'>Files to be deleted:</Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto', pl: 2 }}>
              {filesToDelete.map((file) => (
                <Typography key={file._id} variant='body2'>
                  {file.name}
                </Typography>
              ))}
            </Box>
          </>
        )}
      </Stack>
    </ConfirmationDialogue>
  )
}
