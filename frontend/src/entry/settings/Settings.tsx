import { Container, Divider, List, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import AccessRequestSettings from 'src/entry/model/settings/AccessRequestSettings'
import TemplateSettings from 'src/entry/model/settings/TemplateSettings'
import DangerZone from 'src/entry/settings/DangerZone'
import EntryAccessTab from 'src/entry/settings/EntryAccessTab'
import EntryDetails from 'src/entry/settings/EntryDetails'
import { EntryInterface, EntryKind, EntryKindKeys } from 'types/types'
import { getRequiredRolesText, hasRole } from 'utils/roles'
import { toTitleCase } from 'utils/stringUtils'

export const SettingsCategory = {
  DETAILS: 'details',
  DANGER: 'danger',
  ACCESS_REQUESTS: 'access_requests',
  PERMISSIONS: 'permissions',
  TEMPLATE: 'template',
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
        value === SettingsCategory.PERMISSIONS ||
        value === SettingsCategory.ACCESS_REQUESTS ||
        value === SettingsCategory.DANGER ||
        value === SettingsCategory.TEMPLATE
      )
    case EntryKind.DATA_CARD:
      return value === SettingsCategory.DETAILS || value === SettingsCategory.PERMISSIONS
  }
}

type SettingsProps = {
  entry: EntryInterface
  currentUserRoles: string[]
}

export default function Settings({ entry, currentUserRoles }: SettingsProps) {
  const router = useRouter()

  const { category } = router.query

  const [selectedCategory, setSelectedCategory] = useState<SettingsCategoryKeys>(SettingsCategory.DETAILS)

  const [isReadOnly, requiredRolesText] = useMemo(() => {
    const validRoles = ['owner']
    return [!hasRole(currentUserRoles, validRoles), getRequiredRolesText(currentUserRoles, validRoles)]
  }, [currentUserRoles])

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
          {`${toTitleCase(entry.kind)} Access`}
        </SimpleListItemButton>
        {entry.kind === EntryKind.MODEL && (
          <>
            <SimpleListItemButton
              selected={selectedCategory === SettingsCategory.ACCESS_REQUESTS}
              onClick={() => handleListItemClick(SettingsCategory.ACCESS_REQUESTS)}
            >
              Access Requests
            </SimpleListItemButton>
            <SimpleListItemButton
              selected={selectedCategory === SettingsCategory.TEMPLATE}
              onClick={() => handleListItemClick(SettingsCategory.TEMPLATE)}
            >
              Templating
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
        {selectedCategory === SettingsCategory.DETAILS && (
          <EntryDetails entry={entry} isReadOnly={isReadOnly} requiredRolesText={requiredRolesText} />
        )}
        {selectedCategory === SettingsCategory.PERMISSIONS && (
          <EntryAccessTab entry={entry} isReadOnly={isReadOnly} requiredRolesText={requiredRolesText} />
        )}
        {selectedCategory === SettingsCategory.ACCESS_REQUESTS && (
          <AccessRequestSettings model={entry} isReadOnly={isReadOnly} requiredRolesText={requiredRolesText} />
        )}
        {selectedCategory === SettingsCategory.TEMPLATE && (
          <TemplateSettings model={entry} isReadOnly={isReadOnly} requiredRolesText={requiredRolesText} />
        )}
        {selectedCategory === SettingsCategory.DANGER && (
          <DangerZone entry={entry} isReadOnly={isReadOnly} requiredRolesText={requiredRolesText} />
        )}
      </Container>
    </Stack>
  )
}
