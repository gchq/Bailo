import { Chip } from '@mui/material'
import { useMemo } from 'react'
import { CollaboratorEntry, Role, UiConfig } from 'types/types'
import { getRoleDisplayName } from 'utils/roles'

type EntryRolesChipSetProps = {
  entryCollaborator: CollaboratorEntry
  modelRoles: Role[]
  uiConfig: UiConfig
}

export default function EntryRolesChipSet({ entryCollaborator, modelRoles, uiConfig }: EntryRolesChipSetProps) {
  const roleChips = useMemo(
    () =>
      entryCollaborator.roles.map((role) => (
        <Chip key={role} label={getRoleDisplayName(role, modelRoles, uiConfig)} color='primary' sx={{ mr: 1 }} />
      )),
    [entryCollaborator.roles, modelRoles, uiConfig],
  )

  return roleChips.length ? roleChips : <Chip label='No roles' color='warning' />
}
