import { Grid, Stack } from '@mui/material'
import { useGetModelRoles } from 'actions/model'
import { Fragment, useMemo } from 'react'
import Loading from 'src/common/Loading'
import EntityIcon from 'src/entry/EntityIcon'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryRolesChipSet from 'src/entry/overview/EntryRolesChipSet'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

type EntryRoleListProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryRoleListProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(entry.id)
  const rows = useMemo(
    () =>
      entry.collaborators.map((collaborator) => (
        <Fragment key={collaborator.entity}>
          <Grid size={{ xs: 6 }}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <EntityIcon entryCollaborator={collaborator} />
              <EntityNameDisplay entryCollaborator={collaborator} />
            </Stack>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <EntryRolesChipSet entryCollaborator={collaborator} modelRoles={modelRoles} />
          </Grid>
        </Fragment>
      )),
    [entry.collaborators, modelRoles],
  )

  if (isModelRolesLoading) {
    return <Loading />
  }

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6 }}>Entity</Grid>
      <Grid size={{ xs: 6 }}>Roles</Grid>
      {rows}
    </Grid>
  )
}
