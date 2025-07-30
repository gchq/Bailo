import { Box, Button, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import EntryRolesDialog from 'src/entry/overview/EntryRolesDialog'
import { EntryInterface } from 'types/types'

interface OrganisationAndStateDetailsProps {
  entry: EntryInterface
}

export default function OrganisationAndStateDetails({ entry }: OrganisationAndStateDetailsProps) {
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)

  const theme = useTheme()

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
      <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} alignItems='center' sx={{ mr: 0 }}>
        <Stack spacing={1}>
          <Box>
            <Typography>
              <span style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>Organisation: </span>
              {entry.organisation || 'Not set'}
            </Typography>
          </Box>
          <Box>
            <Typography>
              <span style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>State: </span>
              <span>{entry.state || 'Not set'}</span>
            </Typography>
          </Box>
        </Stack>
        <Stack spacing={1} sx={{ width: { sm: '100%', md: 'max-content' } }}>
          <Button
            size='small'
            onClick={() => setRolesDialogOpen(true)}
            sx={{ width: 'max-content', fontWeight: 'bold' }}
          >
            View collaborators
          </Button>
          {collaboratorList}
        </Stack>
      </Stack>
      <EntryRolesDialog entry={entry} open={rolesDialogOpen} onClose={() => setRolesDialogOpen(false)} />
    </Box>
  )
}
