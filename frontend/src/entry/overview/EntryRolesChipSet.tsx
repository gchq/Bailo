import { Chip } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, SystemRole } from 'types/types'
import { getRoleDisplayName } from 'utils/roles'

type EntryRolesChipSetProps = {
  entryCollaborator: CollaboratorEntry
  modelRoles: SystemRole[]
}

export default function EntryRolesChipSet({ entryCollaborator, modelRoles }: EntryRolesChipSetProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const roleChips = useMemo(
    () =>
      entryCollaborator.roles.map((role) => (
        <Chip
          key={role}
          label={uiConfig ? getRoleDisplayName(role, modelRoles, uiConfig) : role}
          color='primary'
          sx={{ mr: 1 }}
        />
      )),
    [entryCollaborator.roles, modelRoles, uiConfig],
  )

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading) {
    return <Loading />
  }

  return roleChips.length ? roleChips : <Chip label='No roles' color='warning' />
}
