import { Box, Grid, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useGetModelRoles } from 'actions/model'
import { ReactNode, useCallback, useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { RoleKind } from 'types/types'

interface EntryRolesInfoProps {
  modelId: string
}

export default function EntryRolesInfo({ modelId }: EntryRolesInfoProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)

  const getFilteredRoles = useCallback(
    (roleKind: string) =>
      modelRoles.reduce<ReactNode[]>((filteredRoles, entryRole) => {
        if (entryRole.kind === roleKind) {
          filteredRoles.push(
            <Box key={entryRole.id}>
              <Typography fontWeight='bold'>{entryRole.name}</Typography>
              <Typography>{entryRole.description}</Typography>
            </Box>,
          )
        }
        return filteredRoles
      }, []),
    [modelRoles],
  )

  const modelRolesList = useMemo(() => getFilteredRoles(RoleKind.ENTRY), [getFilteredRoles])
  const schemaRolesList = useMemo(() => getFilteredRoles(RoleKind.SCHEMA), [getFilteredRoles])

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      {!isModelRolesLoading && (
        <Stack spacing={2}>
          <Typography>
            Roles in Bailo are split into two categories; standard and dynamic. Standard roles are generic across
            different schema and are used for determining entry permissions for general purpose entry upkeep, whereas
            dynamic roles are created on a per schema basis and used as part of the review process. The dynamic roles
            presented below are specified on the schema selected for this entry and may not apply to other entries using
            a different schema.
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography component='h3' variant='h6' fontWeight='bold'>
                    Standard Roles
                  </Typography>
                  <Typography variant='caption'>The following roles are generic across all entries</Typography>
                </Box>
                {modelRolesList}
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography component='h3' variant='h6' fontWeight='bold'>
                    Dynamic Roles
                  </Typography>
                  <Typography variant='caption'>
                    {`The following roles are specified by this entry's schema`}
                  </Typography>
                </Box>
                {schemaRolesList}
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}
    </>
  )
}
