import { Box, Button, Divider, List, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { ModelInterface } from '../../../types/v2/types'
import AccessRequestSettings from './settings/AccessRequestSettings'
import ModelAccess from './settings/ModelAccess'
import ModelDetails from './settings/ModelDetails'

type SettingsCategory = 'general' | 'danger' | 'access' | 'permissions'

type SettingsProps = {
  model: ModelInterface
}

export default function Settings({ model }: SettingsProps) {
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>('general')

  const handleListItemClick = (category: SettingsCategory) => {
    setSelectedCategory(category)
  }
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ sm: 2 }}
      divider={<Divider orientation='vertical' flexItem />}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton selected={selectedCategory === 'general'} onClick={() => handleListItemClick('general')}>
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
        {selectedCategory === 'general' && <ModelDetails model={model} />}
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
