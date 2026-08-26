import { Box, Button, Chip, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import prettyBytes from 'pretty-bytes'
import { useMemo } from 'react'
import { ReleaseInterface } from 'types/types'
import { formatDateTimeString } from 'utils/dateUtils'
import { FileConflict } from 'utils/fileTreeUtils'
import { plural } from 'utils/stringUtils'

export type ConflictAction = 'overwrite' | 'skip'

interface ConflictResolutionListProps {
  conflicts: FileConflict[]
  resolutions: Map<string, ConflictAction>
  releases: ReleaseInterface[]
  onResolutionChange: (fileName: string, action: ConflictAction) => void
  onApplyAll: (action: ConflictAction) => void
}

export default function ConflictResolutionList({
  conflicts,
  resolutions,
  releases,
  onResolutionChange,
  onApplyAll,
}: ConflictResolutionListProps) {
  const releasesByFileId = useMemo(() => {
    const map = new Map<string, ReleaseInterface[]>()
    for (const release of releases) {
      for (const fileId of release.fileIds) {
        const existing = map.get(fileId) || []
        existing.push(release)
        map.set(fileId, existing)
      }
    }
    return map
  }, [releases])

  return (
    <Stack spacing={2}>
      <Typography>
        {plural(conflicts.length, 'file')} already {conflicts.length === 1 ? 'exists' : 'exist'} at the destination.
        Choose how to handle each conflict.
      </Typography>
      <Stack direction='row' spacing={1}>
        <Button size='small' variant='outlined' onClick={() => onApplyAll('overwrite')}>
          Overwrite All
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
            const affectedReleases = releasesByFileId.get(conflict.existingFile._id) || []

            return (
              <Stack key={uploadName} spacing={1}>
                <Stack direction='row' spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                      {uploadName}
                    </Typography>
                    <Stack direction='row' spacing={2}>
                      <Typography variant='caption'>
                        Existing: {prettyBytes(conflict.existingFile.size)}, uploaded{' '}
                        {formatDateTimeString(conflict.existingFile.createdAt.toString())}
                      </Typography>
                    </Stack>
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
                    <ToggleButton value='overwrite'>Overwrite</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
                {action === 'overwrite' && affectedReleases.length > 0 && (
                  <Typography color='error' variant='body2'>
                    Warning: Overwriting will affect {plural(affectedReleases.length, 'release')}:{' '}
                    {affectedReleases.map((r) => r.semver).join(', ')}
                  </Typography>
                )}
                {action === 'overwrite' && affectedReleases.length > 0 && (
                  <Stack direction='row' spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {affectedReleases.map((r) => (
                      <Chip key={r._id} label={r.semver} size='small' color='error' variant='outlined' />
                    ))}
                  </Stack>
                )}
              </Stack>
            )
          })}
        </Stack>
      </Box>
    </Stack>
  )
}
