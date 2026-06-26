import { Compare, PublishedWithChanges, Schema, SupervisorAccount } from '@mui/icons-material'
import { Container, Divider, List, Paper, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import Title from 'src/common/Title'
import ReviewRoleList from 'src/reviewRoles/ReviewRoleList'
import SchemaCompare from 'src/schemas/SchemaCompare'
import SchemaMigrationList from 'src/schemas/SchemaMigrationList'
import SchemaTab from 'src/schemas/SchemaTab'

export const AdminSection = {
  SCHEMA_LIST: 'schema-list',
  COMPARE: 'compare',
  MIGRATION: 'migration',
  ROLES: 'roles',
} as const

function isAdminSection(value: string | string[] | undefined): value is AdminSectionKeys {
  return (
    value === AdminSection.SCHEMA_LIST ||
    value === AdminSection.COMPARE ||
    value === AdminSection.MIGRATION ||
    value === AdminSection.ROLES
  )
}

export type AdminSectionKeys = (typeof AdminSection)[keyof typeof AdminSection]

export default function Admin() {
  const router = useRouter()
  const { section } = router.query

  const [selectedSection, setSelectedSection] = useState<AdminSectionKeys>(AdminSection.SCHEMA_LIST)

  useEffect(() => {
    if (isAdminSection(section)) {
      setSelectedSection(section)
    } else if (section) {
      setSelectedSection(AdminSection.SCHEMA_LIST)
      router.replace({
        query: { ...router.query, section: AdminSection.SCHEMA_LIST },
      })
    }
  }, [section, router])

  const handleListItemClick = (section: AdminSectionKeys) => {
    setSelectedSection(section)
    router.replace({
      query: { ...router.query, section },
    })
  }

  return (
    <>
      <Title text='Admin' />
      <Container maxWidth='xl'>
        <Paper sx={{ p: 6 }}>
          <Typography sx={{ fontWeight: 'bold', mb: 2 }} variant='h5' component='h1' color='primary'>
            Admin panel
          </Typography>
          <Divider />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ sm: 2 }}
            divider={<Divider orientation='vertical' flexItem />}
          >
            <List sx={{ width: '280px' }}>
              <Typography variant='caption'>Schemas</Typography>
              <SimpleListItemButton
                selected={selectedSection === AdminSection.SCHEMA_LIST}
                onClick={() => handleListItemClick(AdminSection.SCHEMA_LIST)}
                icon={<Schema color={selectedSection === AdminSection.SCHEMA_LIST ? 'secondary' : 'inherit'} />}
              >
                Schema list
              </SimpleListItemButton>
              <SimpleListItemButton
                selected={selectedSection === AdminSection.COMPARE}
                onClick={() => handleListItemClick(AdminSection.COMPARE)}
                icon={<Compare color={selectedSection === AdminSection.COMPARE ? 'secondary' : 'inherit'} />}
              >
                Schema compare
              </SimpleListItemButton>
              <SimpleListItemButton
                selected={selectedSection === AdminSection.MIGRATION}
                onClick={() => handleListItemClick(AdminSection.MIGRATION)}
                icon={
                  <PublishedWithChanges color={selectedSection === AdminSection.MIGRATION ? 'secondary' : 'inherit'} />
                }
              >
                Schema migration
              </SimpleListItemButton>
              <Divider sx={{ mb: 2, mt: 1 }} />
              <Typography variant='caption'>Review</Typography>
              <SimpleListItemButton
                selected={selectedSection === AdminSection.ROLES}
                onClick={() => handleListItemClick(AdminSection.ROLES)}
                icon={<SupervisorAccount color={selectedSection === AdminSection.ROLES ? 'secondary' : 'inherit'} />}
              >
                Roles
              </SimpleListItemButton>
            </List>
            <Container sx={{ my: 2 }}>
              {selectedSection === AdminSection.SCHEMA_LIST && <SchemaTab />}
              {selectedSection === AdminSection.COMPARE && <SchemaCompare />}
              {selectedSection === AdminSection.MIGRATION && <SchemaMigrationList />}
              {selectedSection === AdminSection.ROLES && <ReviewRoleList />}
            </Container>
          </Stack>
        </Paper>
      </Container>
    </>
  )
}
