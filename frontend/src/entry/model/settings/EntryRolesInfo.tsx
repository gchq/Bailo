import { Box, Grid, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useGetModelRoles } from 'actions/model'
import { ReactNode, useCallback, useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, RoleKind } from 'types/types'
import { toSentenceCase } from 'utils/stringUtils'

interface EntryRolesInfoProps {
  entry: EntryInterface
}

export default function EntryRolesInfo({ entry }: EntryRolesInfoProps) {
  const {
    modelRoles: entryRoles,
    isModelRolesLoading: isEntryRolesLoading,
    isModelRolesError: isEntryRolesError,
  } = useGetModelRoles(entry.id)

  const getFilteredRoles = useCallback(
    (roleKind: string) =>
      entryRoles.reduce<ReactNode[]>((filteredRoles, entryRole) => {
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
    [entryRoles],
  )

  const entryRolesList = useMemo(() => getFilteredRoles(RoleKind.ENTRY), [getFilteredRoles])
  const schemaRolesList = useMemo(() => getFilteredRoles(RoleKind.SCHEMA), [getFilteredRoles])

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isEntryRolesLoading && <Loading />}
      {!isEntryRolesLoading && (
        <Stack spacing={2}>
          <Typography>
            Roles in Bailo are split into two categories; standard and dynamic. Standard roles are generic across
            different schema and are used for determining {`${toSentenceCase(entry.kind)}`} permissions for general
            purpose {`${toSentenceCase(entry.kind)}`} upkeep, whereas dynamic roles are created on a per schema basis
            and used as part of the review process. The dynamic roles presented below are specified on the schema
            selected for this {`${toSentenceCase(entry.kind)}`} and may not apply to other{' '}
            {`${toSentenceCase(entry.kind)}s`} using a different schema.
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography component='h3' variant='h6' fontWeight='bold'>
                    Standard Roles
                  </Typography>
                  <Typography variant='caption'>
                    {`The following roles are generic across all ${toSentenceCase(entry.kind)}s`}
                  </Typography>
                </Box>
                {entryRolesList}
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography component='h3' variant='h6' fontWeight='bold'>
                    Dynamic Roles
                  </Typography>
                  <Typography variant='caption'>
                    {`The following roles are specified by this ${toSentenceCase(entry.kind)}'s schema`}
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
