import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import EntryRolesDialog from 'src/entry/overview/EntryRolesDialog'
import { EntryInterface } from 'types/types'

interface OrganisationAndStateDetailsProps {
  entry: EntryInterface
}

export default function OrganisationAndStateDetails({ entry }: OrganisationAndStateDetailsProps) {
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)

  const collaboratorList = useMemo(() => {
    return (
      <Stack direction='row' alignItems='center' spacing={1}>
        {entry.collaborators.slice(0, 5).map((collaborator) => {
          return <UserDisplay key={collaborator.entity} dn={collaborator.entity} displayAsAvatar smallAvatars />
        })}
        {entry.collaborators.length > 5 && <Typography>...and {entry.collaborators.length - 5} more</Typography>}
      </Stack>
    )
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
        <Stack spacing={1}>
          <Button size='small' onClick={() => setRolesDialogOpen(true)} sx={{ width: 'max-content' }}>
            View collaborators
          </Button>
          {collaboratorList}
        </Stack>
        <EntryRolesDialog entry={entry} open={rolesDialogOpen} onClose={() => setRolesDialogOpen(false)} />
      </Stack>
    </Box>
  )
}
