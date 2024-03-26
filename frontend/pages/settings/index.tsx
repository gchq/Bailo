import { useGetCurrentUser } from 'actions/user'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs from 'src/common/PageWithTabs'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import AuthenticationTab from 'src/settings/authentication/AuthenticationTab'
import DisplayTab from 'src/settings/display/DisplayTab'
import ProfileTab from 'src/settings/ProfileTab'
import Wrapper from 'src/Wrapper'

export default function Settings() {
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const tabs = useMemo(
    () =>
      currentUser
        ? [
            { title: 'Profile', path: 'profile', view: <ProfileTab user={currentUser} /> },
            { title: 'Authentication', path: 'authentication', view: <AuthenticationTab /> },
            { title: 'Display', path: 'display', view: <DisplayTab /> },
          ]
        : [],
    [currentUser],
  )

  const error = MultipleErrorWrapper(`Unable to load settings page`, {
    isCurrentUserError,
  })
  if (error) return error

  return (
    <Wrapper fullWidth title='Settings' page='settings'>
      {isCurrentUserLoading && <Loading />}
      <PageWithTabs title='Settings' tabs={tabs} />
    </Wrapper>
  )
}
