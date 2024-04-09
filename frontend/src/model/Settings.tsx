import { LoadingButton } from '@mui/lab'
import { Container, Divider, List, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'

import { ModelInterface } from '../../types/types'
import AccessRequestSettings from './settings/AccessRequestSettings'
import ModelAccess from './settings/ModelAccess'
import ModelDetails from './settings/ModelDetails'

export const SettingsCategory = {
  DETAILS: 'details',
  DANGER: 'danger',
  ACCESS: 'access',
  PERMISSIONS: 'permissions',
} as const

export type SettingsCategoryKeys = (typeof SettingsCategory)[keyof typeof SettingsCategory]

function isSettingsCategory(value: string | string[] | undefined): value is SettingsCategoryKeys {
  return (
    value === SettingsCategory.DETAILS ||
    value === SettingsCategory.DANGER ||
    value === SettingsCategory.ACCESS ||
    value === SettingsCategory.PERMISSIONS
  )
}

type SettingsProps = {
  model: ModelInterface
}

export default function Settings({ model }: SettingsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { section } = router.query

  const [selectedCategory, setSelectedCategory] = useState<SettingsCategoryKeys>(SettingsCategory.DETAILS)

  useEffect(() => {
    if (isSettingsCategory(section)) {
      setSelectedCategory(section ?? SettingsCategory.DETAILS)
    }
  }, [section, setSelectedCategory])

  const handleListItemClick = (category: SettingsCategoryKeys) => {
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
        <SimpleListItemButton
          selected={selectedCategory === SettingsCategory.DETAILS}
          onClick={() => handleListItemClick(SettingsCategory.DETAILS)}
        >
          Details
        </SimpleListItemButton>
        <SimpleListItemButton
          selected={selectedCategory === SettingsCategory.PERMISSIONS}
          onClick={() => handleListItemClick(SettingsCategory.PERMISSIONS)}
        >
          Model Access
        </SimpleListItemButton>
        <SimpleListItemButton
          selected={selectedCategory === SettingsCategory.ACCESS}
          onClick={() => handleListItemClick(SettingsCategory.ACCESS)}
        >
          Access Requests
        </SimpleListItemButton>
        <SimpleListItemButton
          selected={selectedCategory === SettingsCategory.DANGER}
          onClick={() => handleListItemClick(SettingsCategory.DANGER)}
        >
          Danger Zone
        </SimpleListItemButton>
      </List>
      <Container sx={{ my: 2 }}>
        {selectedCategory === SettingsCategory.DETAILS && <ModelDetails model={model} />}
        {selectedCategory === SettingsCategory.PERMISSIONS && <ModelAccess model={model} />}
        {selectedCategory === SettingsCategory.ACCESS && <AccessRequestSettings model={model} />}
        {selectedCategory === SettingsCategory.DANGER && (
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
