import { LoadingButton } from '@mui/lab'
import { Container, Divider, List, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'

import { ModelInterface } from '../../types/types'
import AccessRequestSettings from './settings/AccessRequestSettings'
import ModelAccess from './settings/ModelAccess'
import ModelDetails from './settings/ModelDetails'

type SettingsCategory = 'details' | 'danger' | 'access' | 'permissions'

function isSettingsCategory(value: string | string[] | undefined): value is SettingsCategory {
  return value === 'details' || value === 'danger' || value === 'access' || value === 'permissions'
}

type SettingsProps = {
  model: ModelInterface
}

export default function Settings({ model }: SettingsProps) {
  const [loading, setLoading] = useState(false)
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

  const handleDeleteModel = () => {
    setLoading(true)

    // TODO - Delete model API request and setLoading(false) on error
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ sm: 2 }}
      divider={<Divider orientation='vertical' flexItem />}
    >
      <List sx={{ width: '200px' }}>
        <SimpleListItemButton selected={selectedCategory === 'details'} onClick={() => handleListItemClick('details')}>
          Details
        </SimpleListItemButton>
        <SimpleListItemButton
          selected={selectedCategory === 'permissions'}
          onClick={() => handleListItemClick('permissions')}
        >
          Model Access
        </SimpleListItemButton>
        <SimpleListItemButton selected={selectedCategory === 'access'} onClick={() => handleListItemClick('access')}>
          Access Requests
        </SimpleListItemButton>
        <SimpleListItemButton selected={selectedCategory === 'danger'} onClick={() => handleListItemClick('danger')}>
          Danger Zone
        </SimpleListItemButton>
      </List>
      <Container sx={{ my: 2 }}>
        {selectedCategory === 'details' && <ModelDetails model={model} />}
        {selectedCategory === 'permissions' && <ModelAccess model={model} />}
        {selectedCategory === 'access' && <AccessRequestSettings model={model} />}
        {selectedCategory === 'danger' && (
          <Stack spacing={2}>
            <Typography variant='h6' component='h2'>
              Danger Zone!
            </Typography>
            <LoadingButton variant='contained' disabled onClick={handleDeleteModel} loading={loading}>
              Delete model
            </LoadingButton>
          </Stack>
        )}
      </Container>
    </Stack>
  )
}
