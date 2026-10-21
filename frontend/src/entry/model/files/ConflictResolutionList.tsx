import { Box, Button, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import prettyBytes from 'pretty-bytes'
import { formatDateTimeString } from 'utils/dateUtils'
import { FileConflict } from 'utils/fileTreeUtils'
import { plural } from 'utils/stringUtils'

export type ConflictAction = 'keepBoth' | 'skip'

interface ConflictResolutionListProps {
  conflicts: FileConflict[]
  resolutions: Map<string, ConflictAction>
  onResolutionChange: (fileName: string, action: ConflictAction) => void
  onApplyAll: (action: ConflictAction) => void
}

export default function ConflictResolutionList({
  conflicts,
  resolutions,
  onResolutionChange,
  onApplyAll,
}: ConflictResolutionListProps) {
  return (
    <Stack spacing={2}>
      <Typography>
        {plural(conflicts.length, 'file')} already {conflicts.length === 1 ? 'exists' : 'exist'} at the destination.
        Choose how to handle each conflict. Keeping both uploads the new file alongside the existing one, which is left
        unchanged along with any releases that use it.
      </Typography>
      <Stack direction='row' spacing={1}>
        <Button size='small' variant='outlined' onClick={() => onApplyAll('keepBoth')}>
          Keep Both for All
        </Button>
        <Button size='small' variant='outlined' onClick={() => onApplyAll('skip')}>
          Skip All
        </Button>
      </Stack>
      <Divider />
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        <Stack spacing={2} divider={<Divider />}>
          {conflicts.map((conflict) => {
            const uploadName = conflict.fileToUpload.uploadPath || conflict.fileToUpload.file.name
            const action = resolutions.get(uploadName) || 'skip'

            return (
              <Stack key={uploadName} direction='row' spacing={2} sx={{ alignItems: 'center' }}>
                <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='body2' sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                    {uploadName}
                  </Typography>
                  <Typography variant='caption'>
                    Existing: {prettyBytes(conflict.existingFile.size)}, uploaded{' '}
                    {formatDateTimeString(conflict.existingFile.createdAt.toString())}
                  </Typography>
                  <Typography variant='caption'>New: {prettyBytes(conflict.fileToUpload.file.size)}</Typography>
                </Stack>
                <ToggleButtonGroup
                  size='small'
                  exclusive
                  value={action}
                  onChange={(_, newAction) => {
                    if (newAction !== null) {
                      onResolutionChange(uploadName, newAction)
                    }
                  }}
                >
                  <ToggleButton value='skip'>Skip</ToggleButton>
                  <ToggleButton value='keepBoth'>Keep both</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            )
          })}
        </Stack>
      </Box>
    </Stack>
  )
}
