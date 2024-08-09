import { Chip } from '@mui/material'
import { useMemo } from 'react'
import { CollaboratorEntry } from 'types/types'

type EntryRolesChipSetProps = {
  entryCollaborator: CollaboratorEntry
}

export default function EntryRolesChipSet({ entryCollaborator }: EntryRolesChipSetProps) {
  const roleChips = useMemo(
    () => entryCollaborator.roles.map((role) => <Chip key={role} label={role} color='primary' sx={{ mr: 1 }} />),
    [entryCollaborator.roles],
  )

  return roleChips.length ? roleChips : <Chip label='No roles' color='warning' />
}
