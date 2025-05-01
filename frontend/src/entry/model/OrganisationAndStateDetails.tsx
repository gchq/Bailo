import { Person } from '@mui/icons-material'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import EntryRolesDialog from 'src/entry/overview/EntryRolesDialog'
import { EntityKind, EntryInterface } from 'types/types'

interface OrganisationAndStateDetailsProps {
  entry: EntryInterface
}

export default function OrganisationAndStateDetails({ entry }: OrganisationAndStateDetailsProps) {
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)

  const collaboratorList = useMemo(() => {
    return entry.collaborators.map((collaborator) => {
      return <UserDisplay dn={collaborator.entity} displayAsAvatar />
    })
  }, [entry])

  return (
    <Box>
      <Stack
        direction={{ md: 'column', lg: 'row' }}
        spacing={2}
        justifyContent='center'
        sx={{ mr: 0 }}
        divider={<Divider flexItem />}
      >
        <Stack>
          {entry.organisation && (
            <Box>
              <Typography>
                <span style={{ fontWeight: 'bold' }}>Organisation: </span>
                {entry.organisation}
              </Typography>
            </Box>
          )}
          {entry.state && (
            <Box>
              <Typography>
                <span style={{ fontWeight: 'bold' }}>State: </span>
                {entry.state}
              </Typography>
            </Box>
          )}
        </Stack>
        <Box>
          <Typography fontWeight='bold'>Collaborators</Typography>
          {collaboratorList}
        </Box>
        <EntryRolesDialog entry={entry} open={rolesDialogOpen} onClose={() => setRolesDialogOpen(false)} />
      </Stack>
    </Box>
  )
}
