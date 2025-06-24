import { Grid2, Stack } from '@mui/material'
import { useGetModelRoles } from 'actions/model'
import { useGetUiConfig } from 'actions/uiConfig'
import { Fragment, useMemo } from 'react'
import EntityIcon from 'src/entry/EntityIcon'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryRolesChipSet from 'src/entry/overview/EntryRolesChipSet'
import { EntryInterface } from 'types/types'

type EntryRoleListProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryRoleListProps) {
  const { uiConfig } = useGetUiConfig() //TODO ADD THE LOADING AND ERRORS FOR THESE TWO
  const { modelRoles } = useGetModelRoles()
  const rows = useMemo(
    () =>
      entry.collaborators.map((collaborator) => (
        <Fragment key={collaborator.entity}>
          <Grid2 size={{ xs: 6 }}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <EntityIcon entryCollaborator={collaborator} />
              <EntityNameDisplay entryCollaborator={collaborator} />
            </Stack>
          </Grid2>
          <Grid2 size={{ xs: 6 }}>
            {uiConfig && (
              <EntryRolesChipSet entryCollaborator={collaborator} modelRoles={modelRoles} uiConfig={uiConfig} />
            )}
          </Grid2>
        </Fragment>
      )),
    [entry.collaborators, modelRoles, uiConfig],
  )

  return (
    <Grid2 container spacing={2}>
      <Grid2 size={{ xs: 6 }}>Entity</Grid2>
      <Grid2 size={{ xs: 6 }}>Roles</Grid2>
      {rows}
    </Grid2>
  )
}
