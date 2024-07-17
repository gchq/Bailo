import { Done } from '@mui/icons-material'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
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
          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography component='h3' variant='h6' fontWeight='bold'>
                General Permissions
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 250 }}>
                <Table sx={{ minWidth: 650 }} stickyHeader size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Permission</TableCell>
                      <TableCell align='right'>Owner</TableCell>
                      <TableCell align='right'>Contributor</TableCell>
                      <TableCell align='right'>Consumer</TableCell>
                      <TableCell align='right'>Release Reviewer</TableCell>
                      <TableCell align='right'>Access Reviewer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.permission} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component='th' scope='row'>
                          {row.permission}
                        </TableCell>
                        <TableCell align='center'>{row.roles.includes('owner') ? <Done /> : <></>}</TableCell>
                        <TableCell align='center'>{row.roles.includes('contributor') ? <Done /> : <></>}</TableCell>
                        <TableCell align='center'>{row.roles.includes('consumer') ? <Done /> : <></>}</TableCell>
                        <TableCell align='center'>{row.roles.includes('releaseReviewer') ? <Done /> : <></>}</TableCell>
                        <TableCell align='center'>{row.roles.includes('accessReviewer') ? <Done /> : <></>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
            <Stack spacing={1}>
              <Box>
                <Typography component='h3' variant='h6' fontWeight='bold'>
                  Dynamic Roles
                </Typography>
                <Typography variant='caption'>
                  {`The following roles are specified by this ${toSentenceCase(entry.kind)}'s schema.`}
                </Typography>
              </Box>
              {schemaRolesList}
            </Stack>
          </Stack>
        </Stack>
      )}
    </>
  )
}

const rows = [
  {
    permission: 'View private model',
    roles: ['owner', 'contributor', 'consumer', 'releaseReviewer', 'accessReviewer'],
  },
  {
    permission: 'Edit a model card',
    roles: ['owner', 'contributor'],
  },
  {
    permission: 'Draft a release',
    roles: ['owner', 'contributor'],
  },
  {
    permission: 'Edit a release',
    roles: ['owner', 'contributor'],
  },
  {
    permission: 'Request inferencing service',
    roles: ['owner', 'contributor'],
  },
  {
    permission: 'Push an image',
    roles: ['owner', 'contributor'],
  },
  {
    permission: 'Edit or delete an inferencing form',
    roles: ['owner', 'contributor'],
  },
  {
    permission: 'Request access',
    roles: ['owner', 'contributor', 'consumer'],
  },
  {
    permission: 'Edit or delete any access request',
    roles: ['owner'],
  },
  {
    permission: 'Update model settings',
    roles: ['owner'],
  },
  {
    permission: 'Review a release',
    roles: ['releaseReviewer'],
  },
  {
    permission: 'Review an access request',
    roles: ['accessReviewer'],
  },
]
