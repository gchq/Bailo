import { Box, Button, Divider, List, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { ModelInterface } from '../../../types/types'
import ModelAccess from './settings/ModelAccess'

type SettingsCategory = 'general' | 'danger'

export default function Settings({ model }: { model: ModelInterface }) {
  const [selectedCategory, setSelectedCategory] = useState('general')

  const handleListItemClick = (category: SettingsCategory) => {
    setSelectedCategory(category)
  }
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} divider={<Divider orientation='vertical' flexItem />}>
      <List>
        <ListItem disablePadding>
          <ListItemButton selected={selectedCategory === 'general'} onClick={() => handleListItemClick('general')}>
            General Settings
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton selected={selectedCategory === 'danger'} onClick={() => handleListItemClick('danger')}>
            Danger Zone
          </ListItemButton>
        </ListItem>
      </List>
      <Box>
        {selectedCategory === 'general' && (
          <>
            <Typography variant='h6' component='h2'>
              Manage model access
            </Typography>
            <ModelAccess model={model} />
          </>
        )}
        {selectedCategory === 'danger' && (
          <>
            <Button variant='contained' disabled>
              Delete model
            </Button>
          </>
        )}
      </Box>
    </Stack>
  )
}
