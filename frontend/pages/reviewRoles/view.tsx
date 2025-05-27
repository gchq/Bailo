import { Button, Container, Divider, List, Paper, Stack, Typography } from '@mui/material'
import { useGetAllModelReviewRoles } from 'actions/model'
import { useGetCurrentUser } from 'actions/user'
import { Fragment, useMemo, useState } from 'react'
import Forbidden from 'src/common/Forbidden'
import Loading from 'src/common/Loading'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import { Role } from 'types/types'

export default function ReviewRoles() {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetAllModelReviewRoles()
  const [selectedRole, setSelectedRole] = useState<Role>(modelRoles[0])
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const listRoles = useMemo(
    () =>
      modelRoles.map((modelRole) => (
        <SimpleListItemButton
          selected={selectedRole === modelRole}
          key={modelRole.id}
          onClick={() => setSelectedRole(modelRole)}
        >
          {modelRole.name}
        </SimpleListItemButton>
      )),
    [modelRoles, selectedRole],
  )

  const listRoleDescriptions = useMemo(
    () =>
      modelRoles.map((modelRole) => (
        <Fragment key={modelRole.id}>
          {selectedRole === modelRole && (
            <>
              <Typography color='primary' fontWeight='bold'>
                Description
              </Typography>
              <Typography>{modelRole.description}</Typography>
              <Typography color='primary' fontWeight='bold'>
                Short Name
              </Typography>
              <Typography>{modelRole.short}</Typography>
              <Typography color='primary' fontWeight='bold'>
                System Role
              </Typography>
              {modelRole.collaboratorRole ? <Typography>{modelRole.collaboratorRole}</Typography> : 'None'}
            </>
          )}
        </Fragment>
      )),
    [modelRoles, selectedRole],
  )

  if (isCurrentUserLoading || isModelRolesLoading) {
    return <Loading />
  }

  if (isCurrentUserError) {
    return <ErrorWrapper message={isCurrentUserError.info.message} />
  }

  if (isModelRolesError) {
    return <ErrorWrapper message={isModelRolesError.info.message} />
  }

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <Forbidden
        errorMessage='If you think this is an error please contact the Bailo administrators'
        noMargin
        hideNavButton
      />
    )
  }
  //what happens if the instance has no review roles? it just errors? maybe use empty blob for the second portion

  return (
    <>
      <Container>
        <Stack mx={2} mb={1} direction={'row'} justifyContent={'space-between'}>
          <Typography component='h1' color='primary' variant='h6' noWrap>
            Review Roles
          </Typography>
          <Button variant='contained' href='/reviewRoles/new' color='primary'>
            Create new Review Role
          </Button>
        </Stack>
        <Paper sx={{ p: 4, my: 4 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ sm: 2 }}
            divider={<Divider orientation='vertical' flexItem />}
          >
            <List sx={{ width: '200px' }}>{listRoles}</List>
            <Container sx={{ my: 2 }}>{listRoleDescriptions}</Container>
          </Stack>
        </Paper>
      </Container>
    </>
  )
}
