import { Done } from '@mui/icons-material'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useGetModelRoles } from 'actions/model'
import { ReactNode, useCallback, useMemo } from 'react'
import HelpPopover from 'src/common/HelpPopover'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, RoleKind } from 'types/types'
import { toSentenceCase } from 'utils/stringUtils'

interface EntryRolesInfoProps {
  entry: EntryInterface
}

enum RoleValue {
  OWNER = 'owner',
  CONTRIBUTOR = 'contributor',
  CONSUMER = 'consumer',
  RELEASE_REVIEWER = 'releaseReviewer',
  ACCESS_REVIEWER = 'accessReviewer',
}

interface Row {
  permission: string
  roles: RoleValue[]
  helpText?: string
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

  const permissionTableRows = useMemo(() => {
    return rows.map((row) => (
      <TableRow key={row.permission} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          <Stack direction='row' alignItems='center'>
            {row.permission}
            <RowHelpText row={row} />
          </Stack>
        </TableCell>
        <TableCell align='center'>
          <RoleActionIcon role={RoleValue.OWNER} roles={row.roles} />
        </TableCell>
        <TableCell align='center'>
          <RoleActionIcon role={RoleValue.CONTRIBUTOR} roles={row.roles} />
        </TableCell>
        <TableCell align='center'>
          <RoleActionIcon role={RoleValue.CONSUMER} roles={row.roles} />
        </TableCell>
        <TableCell align='center'>
          <RoleActionIcon role={RoleValue.RELEASE_REVIEWER} roles={row.roles} />
        </TableCell>
        <TableCell align='center'>
          <RoleActionIcon role={RoleValue.ACCESS_REVIEWER} roles={row.roles} />
        </TableCell>
      </TableRow>
    ))
  }, [])
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
                  <TableBody>{permissionTableRows}</TableBody>
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

const rows: Row[] = [
  {
    permission: 'View private model',
    roles: [
      RoleValue.OWNER,
      RoleValue.CONTRIBUTOR,
      RoleValue.CONSUMER,
      RoleValue.RELEASE_REVIEWER,
      RoleValue.ACCESS_REVIEWER,
    ],
  },
  {
    permission: 'Edit a model card',
    roles: [RoleValue.OWNER, RoleValue.CONTRIBUTOR],
  },
  {
    permission: 'Draft a release',
    roles: [RoleValue.OWNER, RoleValue.CONTRIBUTOR],
  },
  {
    permission: 'Edit a release',
    roles: [RoleValue.OWNER, RoleValue.CONTRIBUTOR],
  },
  {
    permission: 'Request inferencing service',
    roles: [RoleValue.OWNER, RoleValue.CONTRIBUTOR],
  },
  {
    permission: 'Push an image',
    roles: [RoleValue.OWNER, RoleValue.CONTRIBUTOR],
  },
  {
    permission: 'Edit or delete an inferencing form',
    roles: [RoleValue.OWNER, RoleValue.CONTRIBUTOR],
  },
  {
    permission: 'Request access',
    roles: [RoleValue.OWNER, RoleValue.CONTRIBUTOR, RoleValue.CONSUMER],
  },
  {
    permission: 'Edit or delete any access request',
    roles: [RoleValue.OWNER],
    helpText: 'You can also edit/delete an access request if you are an Additional Contact',
  },
  {
    permission: 'Update model settings',
    roles: [RoleValue.OWNER],
  },
  {
    permission: 'Review a release',
    roles: [RoleValue.RELEASE_REVIEWER],
  },
  {
    permission: 'Review an access request',
    roles: [RoleValue.ACCESS_REVIEWER],
  },
]

type RowHelpTextProps = {
  row: Row
}

function RowHelpText({ row }: RowHelpTextProps) {
  if (!row.helpText) {
    return null
  }

  return <HelpPopover>{row.helpText}</HelpPopover>
}

type RoleActionIconProps = {
  role: RoleValue
  roles: RoleValue[]
}

function RoleActionIcon({ role, roles }: RoleActionIconProps) {
  if (!roles.includes(role)) {
    return null
  }

  return <Done />
}
