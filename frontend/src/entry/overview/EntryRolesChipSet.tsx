import { Chip } from '@mui/material'
import { useMemo } from 'react'
import { CollaboratorEntry, SystemRole } from 'types/types'
import { getRoleDisplayName } from 'utils/roles'

type EntryRolesChipSetProps = {
  entryCollaborator: CollaboratorEntry
  modelRoles: SystemRole[]
}

export default function EntryRolesChipSet({ entryCollaborator, modelRoles }: EntryRolesChipSetProps) {
  const roleChips = useMemo(
    () =>
      entryCollaborator.roles.map((role) => (
        <Chip key={role} label={getRoleDisplayName(role, modelRoles)} color='primary' sx={{ mr: 1 }} />
      )),
    [entryCollaborator.roles, modelRoles],
  )

  return roleChips.length ? roleChips : <Chip label='No roles' color='warning' />
}
