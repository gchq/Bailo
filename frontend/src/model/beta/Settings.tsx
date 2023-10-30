import { Box, Button, Divider, List, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { ModelInterface } from '../../../types/v2/types'
import AccessRequestSettings from './settings/AccessRequestSettings'
import ModelAccess from './settings/ModelAccess'
import ModelDetails from './settings/ModelDetails'

type SettingsCategory = 'details' | 'danger' | 'access' | 'permissions'

function isSettingsCategory(settingsCategory: string | string[] | undefined): settingsCategory is SettingsCategory {
  return (settingsCategory as SettingsCategory) !== undefined
}

type SettingsProps = {
  model: ModelInterface
}

export default function Settings({ model }: SettingsProps) {
  const router = useRouter()

  const { section } = router.query

  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>('details')

  useEffect(() => {
    if (isSettingsCategory(section)) {
      setSelectedCategory(section ?? 'details')
    }
  }, [section, setSelectedCategory])

  const handleListItemClick = (category: SettingsCategory) => {
    setSelectedCategory(category)
    router.replace({
      query: { ...router.query, section: category },
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
          <ListItemButton selected={selectedCategory === 'details'} onClick={() => handleListItemClick('details')}>
            Details
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={selectedCategory === 'permissions'}
            onClick={() => handleListItemClick('permissions')}
          >
            Model Access
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton selected={selectedCategory === 'access'} onClick={() => handleListItemClick('access')}>
            Access Requests
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton selected={selectedCategory === 'danger'} onClick={() => handleListItemClick('danger')}>
            Danger Zone
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ width: '100%', maxWidth: '1000px' }}>
        {selectedCategory === 'details' && <ModelDetails model={model} />}
        {selectedCategory === 'permissions' && <ModelAccess model={model} />}
        {selectedCategory === 'access' && <AccessRequestSettings />}
        {selectedCategory === 'danger' && (
          <Stack spacing={2}>
            <Typography variant='h6' component='h2'>
              Danger Zone!
            </Typography>
            <Button variant='contained' disabled>
              Delete model
            </Button>
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
