import { Delete, Edit, FileCopy, ImportExport, Key, ManageAccounts } from '@mui/icons-material'
import { Container, Divider, List, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent, useState } from 'react'
import Loading from 'src/common/Loading'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import ExportSettings from 'src/entry/model/mirroredModels/ExportSettings'
import AccessRequestSettings from 'src/entry/model/settings/AccessRequestSettings'
import TemplateSettings from 'src/entry/model/settings/TemplateSettings'
import EntryAccessTab from 'src/entry/settings/EntryAccessTab'
import EntryDeletion from 'src/entry/settings/EntryDeletion'
import EntryDetails from 'src/entry/settings/EntryDetails'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, EntryKind } from 'types/types'

export const SettingsCategory = {
  DETAILS: 'details',
  DELETION: 'deletion',
  ACCESS_REQUESTS: 'access_requests',
  PERMISSIONS: 'permissions',
  MIRRORED_MODELS: 'mirrored_models',
  TEMPLATING: 'templating',
} as const

export type SettingsCategoryKeys = (typeof SettingsCategory)[keyof typeof SettingsCategory]

function isSettingsCategory(
  value: string | string[] | undefined,
  entry: EntryInterface,
): value is SettingsCategoryKeys {
  switch (entry.kind) {
    case EntryKind.MODEL:
      return (
        value === SettingsCategory.DETAILS ||
        value === SettingsCategory.PERMISSIONS ||
        value === SettingsCategory.ACCESS_REQUESTS ||
        value === SettingsCategory.TEMPLATING ||
        value === SettingsCategory.DELETION ||
        value === SettingsCategory.MIRRORED_MODELS
      )
    case EntryKind.DATA_CARD:
      return (
        value === SettingsCategory.DETAILS ||
        value === SettingsCategory.PERMISSIONS ||
        value === SettingsCategory.DELETION
      )
    case EntryKind.MIRRORED_MODEL:
      return (
        value === SettingsCategory.DETAILS ||
        value === SettingsCategory.PERMISSIONS ||
        value === SettingsCategory.DELETION
      )
    default:
      return false
  }
}

type SettingsProps = {
  entry: EntryInterface
}

export default function Settings({ entry }: SettingsProps) {
  const router = useRouter()

  const { category } = router.query

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const [selectedCategory, setSelectedCategory] = useState<SettingsCategoryKeys>(SettingsCategory.DETAILS)

  const onSelectedCategoryChange = useEffectEvent((category: SettingsCategoryKeys) => {
    setSelectedCategory(category)
  })

  useEffect(() => {
    if (isSettingsCategory(category, entry)) {
      onSelectedCategoryChange(category)
    } else if (category) {
      onSelectedCategoryChange(SettingsCategory.DETAILS)
      router.replace({
        query: { ...router.query, category: SettingsCategory.DETAILS },
      })
    }
  }, [category, entry, router])

  const handleListItemClick = (category: SettingsCategoryKeys) => {
    setSelectedCategory(category)
    router.replace({
      query: { ...router.query, category },
    })
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading || !uiConfig) {
    return <Loading />
  }

  return (
    <Container maxWidth='lg'>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ sm: 2 }}
        divider={<Divider orientation='vertical' flexItem />}
      >
        <List sx={{ width: '280px' }}>
          <Typography variant='caption'>General</Typography>
          <SimpleListItemButton
            selected={selectedCategory === SettingsCategory.DETAILS}
            onClick={() => handleListItemClick(SettingsCategory.DETAILS)}
            icon={<Edit color={selectedCategory === SettingsCategory.DETAILS ? 'secondary' : 'inherit'} />}
          >
            Details
          </SimpleListItemButton>
          <SimpleListItemButton
            selected={selectedCategory === SettingsCategory.PERMISSIONS}
            onClick={() => handleListItemClick(SettingsCategory.PERMISSIONS)}
            icon={
              <ManageAccounts color={selectedCategory === SettingsCategory.PERMISSIONS ? 'secondary' : 'inherit'} />
            }
          >
            Access
          </SimpleListItemButton>
          {entry.kind === EntryKind.MODEL && (
            <>
              <Divider sx={{ mb: 2, mt: 1 }} />
              <Typography variant='caption'>Sharing and requests</Typography>
              <SimpleListItemButton
                selected={selectedCategory === SettingsCategory.ACCESS_REQUESTS}
                onClick={() => handleListItemClick(SettingsCategory.ACCESS_REQUESTS)}
                icon={<Key color={selectedCategory === SettingsCategory.ACCESS_REQUESTS ? 'secondary' : 'inherit'} />}
              >
                Access requests
              </SimpleListItemButton>
              <SimpleListItemButton
                selected={selectedCategory === SettingsCategory.TEMPLATING}
                onClick={() => handleListItemClick(SettingsCategory.TEMPLATING)}
                icon={<FileCopy color={selectedCategory === SettingsCategory.TEMPLATING ? 'secondary' : 'inherit'} />}
              >
                Templating
              </SimpleListItemButton>
              {!entry.settings.mirror?.sourceModelId && uiConfig.modelMirror.export.enabled && (
                <SimpleListItemButton
                  selected={selectedCategory === SettingsCategory.MIRRORED_MODELS}
                  onClick={() => handleListItemClick(SettingsCategory.MIRRORED_MODELS)}
                  icon={
                    <ImportExport
                      color={selectedCategory === SettingsCategory.MIRRORED_MODELS ? 'secondary' : 'inherit'}
                    />
                  }
                >
                  Mirrored models
                </SimpleListItemButton>
              )}
            </>
          )}
          <Divider sx={{ mb: 2, mt: 1 }} />
          <Typography variant='caption'>Other</Typography>
          <SimpleListItemButton
            selected={selectedCategory === SettingsCategory.DELETION}
            onClick={() => handleListItemClick(SettingsCategory.DELETION)}
            icon={<Delete color={selectedCategory === SettingsCategory.DELETION ? 'secondary' : 'inherit'} />}
          >
            Deletion
          </SimpleListItemButton>
        </List>
        <Container sx={{ my: 2 }}>
          {selectedCategory === SettingsCategory.DETAILS && <EntryDetails entry={entry} />}
          {selectedCategory === SettingsCategory.PERMISSIONS && <EntryAccessTab entry={entry} />}
          {selectedCategory === SettingsCategory.ACCESS_REQUESTS && <AccessRequestSettings model={entry} />}
          {selectedCategory === SettingsCategory.TEMPLATING && <TemplateSettings model={entry} />}
          {selectedCategory === SettingsCategory.MIRRORED_MODELS && <ExportSettings model={entry} />}
          {selectedCategory === SettingsCategory.DELETION && <EntryDeletion entry={entry} />}
        </Container>
      </Stack>
    </Container>
  )
}
