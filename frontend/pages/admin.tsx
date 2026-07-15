import CompareArrows from '@mui/icons-material/CompareArrows'
import PublishedWithChanges from '@mui/icons-material/PublishedWithChanges'
import Schema from '@mui/icons-material/Schema'
import SupervisorAccount from '@mui/icons-material/SupervisorAccount'
import { Container, Divider, List, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
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

export type AdminSectionKeys = (typeof AdminSection)[keyof typeof AdminSection]

export default function Admin() {
  const [selectedSection, setSelectedSection] = useState<AdminSectionKeys>(AdminSection.SCHEMA_LIST)

  const handleListItemClick = (section: AdminSectionKeys) => {
    setSelectedSection(section)
  }

  return (
    <>
      <Title text='Admin' />
      <Container maxWidth='xl'>
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 'bold', mb: 2 }} variant='h5' component='h1' color='primary'>
            Admin panel
          </Typography>
          <Divider />
          <Stack direction={{ sm: 'column', md: 'row' }} divider={<Divider flexItem orientation='vertical' />}>
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
                icon={<CompareArrows color={selectedSection === AdminSection.COMPARE ? 'secondary' : 'inherit'} />}
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
            <Container sx={{ width: '100%' }}>
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
