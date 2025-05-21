import { Button } from '@mui/material'
import { useGetCurrentUser } from 'actions/user'
import Forbidden from 'src/common/Forbidden'
import Loading from 'src/common/Loading'
import ErrorWrapper from 'src/errors/ErrorWrapper'

export default function ReviewRoles() {
  // const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetAllModelReviewRoles()

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  if (isCurrentUserLoading) {
    return <Loading />
  }

  if (isCurrentUserError) {
    return <ErrorWrapper message={isCurrentUserError.info.message} />
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
      <Button href='/reviewRoles/new'>New</Button>
    </>
  )
}
