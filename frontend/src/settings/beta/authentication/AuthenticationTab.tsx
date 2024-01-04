import { List, ListItem, ListItemButton } from '@mui/material'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { useRouter } from 'next/router'
import { useState } from 'react'
import DockerAuthentication from 'src/settings/beta/authentication/DockerAuthentication'
import PersonalAuthentication from 'src/settings/beta/authentication/PersonalAuthentication'

type AuthenticationCategory = 'personal' | 'docker'

export default function AuthenticationTab() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<AuthenticationCategory>(
    router.query.category === 'personal' || router.query.category === 'docker' ? router.query.category : 'personal',
  )

  const handleListItemClick = (category: AuthenticationCategory) => {
    setSelectedCategory(category)
    router.replace({
      query: { ...router.query, category },
    })
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ sm: 2 }}
      divider={<Divider orientation='vertical' flexItem />}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton selected={selectedCategory === 'personal'} onClick={() => handleListItemClick('personal')}>
            Personal
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton selected={selectedCategory === 'docker'} onClick={() => handleListItemClick('docker')}>
            Docker
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ width: '100%' }}>
        {selectedCategory === 'personal' && <PersonalAuthentication />}
        {selectedCategory === 'docker' && <DockerAuthentication />}
      </Box>
    </Stack>
  )
}
