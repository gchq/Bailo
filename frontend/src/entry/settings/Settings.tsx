import { LoadingButton } from '@mui/lab'
import { Container, Divider, List, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import AccessRequestSettings from 'src/entry/model/settings/AccessRequestSettings'
import ModelAccess from 'src/entry/model/settings/ModelAccess'
import EntryDetails from 'src/entry/settings/EntryDetails'
import { EntryInterface, EntryKind, EntryKindKeys } from 'types/types'

export const SettingsCategory = {
  DETAILS: 'details',
  DANGER: 'danger',
  ACCESS: 'access',
  PERMISSIONS: 'permissions',
} as const

export type SettingsCategoryKeys = (typeof SettingsCategory)[keyof typeof SettingsCategory]

function isSettingsCategory(
  value: string | string[] | undefined,
  entryKind: EntryKindKeys,
): value is SettingsCategoryKeys {
  switch (entryKind) {
    case EntryKind.MODEL:
      return (
        value === SettingsCategory.DETAILS ||
        value === SettingsCategory.DANGER ||
        value === SettingsCategory.ACCESS ||
        value === SettingsCategory.PERMISSIONS
      )
    case EntryKind.DATA_CARD:
      return value === SettingsCategory.DETAILS
  }
}

type SettingsProps = {
  entry: EntryInterface
}

export default function Settings({ entry }: SettingsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { category } = router.query

  const [selectedCategory, setSelectedCategory] = useState<SettingsCategoryKeys>(SettingsCategory.DETAILS)

  useEffect(() => {
    if (isSettingsCategory(category, entry.kind)) {
      setSelectedCategory(category ?? SettingsCategory.DETAILS)
    }
  }, [category, entry.kind])

  const handleListItemClick = (category: SettingsCategoryKeys) => {
    setSelectedCategory(category)
    router.replace({
      query: { ...router.query, category },
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
        {entry.kind === EntryKind.MODEL && (
          <>
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
          </>
        )}
      </List>
      <Container sx={{ my: 2 }}>
        {selectedCategory === SettingsCategory.DETAILS && <EntryDetails entry={entry} />}
        {selectedCategory === SettingsCategory.PERMISSIONS && <ModelAccess model={entry} />}
        {selectedCategory === SettingsCategory.ACCESS && <AccessRequestSettings model={entry} />}
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
