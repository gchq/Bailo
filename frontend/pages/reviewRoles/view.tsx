import Edit from '@mui/icons-material/Edit'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import { Box, Button, Container, Divider, List, Paper, Stack, Typography } from '@mui/material'
import { useGetModelRoles } from 'actions/model'
import { deleteReviewRole, putReviewRole, UpdateReviewRolesParams, useGetReviewRoles } from 'actions/reviewRoles'
import { useGetSchemas } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import { FormEvent, Fragment, useCallback, useContext, useEffect, useEffectEvent, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import EmptyBlob from 'src/common/EmptyBlob'
import Forbidden from 'src/common/Forbidden'
import Loading from 'src/common/Loading'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import Title from 'src/common/Title'
import UserDisplay from 'src/common/UserDisplay'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import ReviewRoleFormContainer from 'src/reviewRoles/ReviewRoleFormContainer'
import { CollaboratorEntry, ReviewRoleInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getRoleDisplayName } from 'utils/roles'
import { plural } from 'utils/stringUtils'

export default function ReviewRoles() {
  const { reviewRoles, isReviewRolesLoading, isReviewRolesError, mutateReviewRoles } = useGetReviewRoles()
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles()
  const [selectedRole, setSelectedRole] = useState<number>(0)
  const [confirmationOpen, setConfirmationOpen] = useState(false)

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  const [isEdit, setIsEdit] = useState<boolean>(false)
  const [formData, setFormData] = useState<UpdateReviewRolesParams>({
    name: '',
    shortName: '',
    systemRole: '',
  })

  const [defaultEntitiesEntry, setDefaultEntitiesEntry] = useState<Array<CollaboratorEntry>>(
    formData.defaultEntities
      ? formData.defaultEntities.map((defaultEntity) => ({ entity: defaultEntity, roles: [] }))
      : [],
  )

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

  function removeExcessReviewRoleParams(reviewRole: ReviewRoleInterface): UpdateReviewRolesParams {
    if (reviewRole) {
      return {
        shortName: reviewRole.shortName,
        name: reviewRole.name,
        description: reviewRole.description,
        defaultEntities: reviewRole.defaultEntities,
        systemRole: reviewRole.systemRole,
      }
    } else {
      return { shortName: '', name: '', systemRole: '' }
    }
  }

  const onSetFormData = useEffectEvent((newFormData: UpdateReviewRolesParams) => {
    setFormData(newFormData)
  })

  useEffect(() => {
    if (reviewRoles) {
      onSetFormData(removeExcessReviewRoleParams(reviewRoles[selectedRole]))
    }
  }, [reviewRoles, selectedRole])

  const listRoles = useMemo(
    () =>
      reviewRoles.map((reviewRole, index) => (
        <SimpleListItemButton
          selected={selectedRole === index}
          key={reviewRole._id}
          onClick={() => setSelectedRole(index)}
          disabled={isEdit}
        >
          {reviewRole.name}
        </SimpleListItemButton>
      )),
    [isEdit, reviewRoles, selectedRole],
  )

  const schemasLength = useCallback(
    (reviewRole: string) => {
      if (schemas) {
        return schemas.filter((schema) => schema.reviewRoles.includes(reviewRole)).length
      } else {
        return 0
      }
    },
    [schemas],
  )

  const handleOpenDeleteConfirmation = useCallback(() => {
    setErrorMessage('')
    setConfirmationOpen(true)
  }, [setErrorMessage, setConfirmationOpen])

  const handleDeleteReviewRole = useCallback(
    async (reviewRoleShortName: string) => {
      const res = await deleteReviewRole(reviewRoleShortName)
      if (res.status !== 200) {
        setErrorMessage('There was a problem deleting this role.')
      } else {
        mutateReviewRoles()
        setConfirmationOpen(false)
      }
    },
    [setErrorMessage, setConfirmationOpen, mutateReviewRoles],
  )

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setErrorMessage('')
      setLoading(true)

      const res = await putReviewRole({
        ...formData,
        defaultEntities: defaultEntitiesEntry.map((entity) => entity.entity),
      } as UpdateReviewRolesParams)

      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
      } else {
        mutateReviewRoles()
        setIsEdit(false)
      }

      setLoading(false)
    },
    [defaultEntitiesEntry, formData, mutateReviewRoles],
  )

  const displayEntityIcon = (defaultEntity: string) => {
    const isUser = defaultEntity.startsWith('user:')
    return isUser ? <PersonIcon color='primary' /> : <GroupsIcon color='secondary' />
  }

  const displayReviewRoleDefaultEntities = useMemo(() => {
    return formData?.defaultEntities && formData?.defaultEntities.length > 0
      ? formData.defaultEntities.map((defaultEntity) => (
          <Stack key={defaultEntity} direction='row' alignItems='center' spacing={1}>
            {displayEntityIcon(defaultEntity)}
            <UserDisplay dn={defaultEntity} />
          </Stack>
        ))
      : 'No entities assigned'
  }, [formData])

  const listRoleDescriptions = useMemo(
    () =>
      reviewRoles.map((reviewRole, index) => (
        <Fragment key={reviewRole._id}>
          {selectedRole === index && (
            <>
              {!isEdit ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography color='primary' fontWeight='bold'>
                      Name
                    </Typography>
                    <Typography>{formData.name}</Typography>
                  </Box>
                  <Box>
                    <Typography color='primary' fontWeight='bold'>
                      Description
                    </Typography>
                    <Typography>{formData?.description || 'No description'}</Typography>
                  </Box>
                  <Box>
                    <Typography color='primary' fontWeight='bold'>
                      System Role
                    </Typography>
                    <Typography>
                      {formData.systemRole ? getRoleDisplayName(formData?.systemRole, modelRoles) : 'No system role'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography color='primary' fontWeight='bold'>
                      Default entities
                    </Typography>
                    {displayReviewRoleDefaultEntities}
                  </Box>
                  <Box display='flex' ml='auto'>
                    <Stack direction='row' spacing={2}>
                      <Button
                        color='primary'
                        sx={{ width: 'max-content' }}
                        variant='outlined'
                        onClick={() => setIsEdit(true)}
                      >
                        Edit Role
                      </Button>
                      <Button
                        color='error'
                        sx={{ width: 'max-content' }}
                        variant='contained'
                        onClick={handleOpenDeleteConfirmation}
                      >
                        Delete role
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              ) : formData ? (
                <ReviewRoleFormContainer
                  formData={formData}
                  setFormData={setFormData}
                  setIsEdit={setIsEdit}
                  providedData={true}
                  headingComponent={
                    <Stack alignItems='center' justifyContent='center' spacing={2} sx={{ mb: 4 }}>
                      <Typography variant='h6' component='h1'>
                        Update Existing Role
                      </Typography>
                      <Edit color='primary' fontSize='large' />
                    </Stack>
                  }
                  handleSubmit={handleSubmit}
                  loading={loading}
                  errorMessage={errorMessage}
                  defaultEntitiesEntry={defaultEntitiesEntry}
                  setDefaultEntities={setDefaultEntitiesEntry}
                />
              ) : (
                <Loading />
              )}
              <ConfirmationDialogue
                open={confirmationOpen}
                title='Deleting this role will remove it from any schemas it is attached to, and will also remove the role from any model collaborators assigned to that role.'
                onCancel={() => setConfirmationOpen(false)}
                onConfirm={() => handleDeleteReviewRole(reviewRole.shortName)}
                dialogMessage={
                  schemasLength(reviewRole.shortName) > 0
                    ? `If deleted, this role will be removed from ${plural(schemasLength(reviewRole.shortName), 'schema')}. Are you sure you want to remove this review role?`
                    : 'Are you sure want to remove this review role?'
                }
                errorMessage={errorMessage}
              />
            </>
          )}
        </Fragment>
      )),
    [
      reviewRoles,
      selectedRole,
      isEdit,
      formData,
      modelRoles,
      displayReviewRoleDefaultEntities,
      handleOpenDeleteConfirmation,
      handleSubmit,
      loading,
      errorMessage,
      defaultEntitiesEntry,
      confirmationOpen,
      schemasLength,
      handleDeleteReviewRole,
    ],
  )

  if (isCurrentUserLoading || isReviewRolesLoading || isSchemasLoading || isModelRolesLoading) {
    return <Loading />
  }

  if (isCurrentUserError) {
    return <ErrorWrapper message={isCurrentUserError.info.message} />
  }

  if (isReviewRolesError) {
    return <ErrorWrapper message={isReviewRolesError.info.message} />
  }

  if (isSchemasError) {
    return <ErrorWrapper message={isSchemasError.info.message} />
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

  return (
    <>
      <Title text='View Review Roles' />
      <Stack mx={2} mb={1} direction='row' divider={<Divider flexItem orientation='vertical' />} spacing={2}>
        <Typography component='h1' color='primary' variant='h6' noWrap>
          Review Roles
        </Typography>
        <Button variant='contained' href='/reviewRoles/new' color='primary'>
          Create new Review Role
        </Button>
      </Stack>
      {reviewRoles ? (
        <Paper sx={{ p: 4, my: 4 }}>
          {reviewRoles.length > 0 ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} divider={<Divider orientation='vertical' flexItem />}>
              <List>{listRoles}</List>
              <Container sx={{ m: 2 }}>{listRoleDescriptions}</Container>
            </Stack>
          ) : (
            <EmptyBlob text='No review roles found. Press button in top-right to create new review role.' />
          )}
        </Paper>
      ) : (
        <Loading />
      )}
    </>
  )
}
