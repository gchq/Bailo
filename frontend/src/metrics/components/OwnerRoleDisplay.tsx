import { useGetEntryRoles } from 'actions/entry'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

export default function OwnerRoleDisplay() {
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles()

  const ownerRoleDisplayName = useMemo(() => {
    if (entryRoles) {
      const displayName = entryRoles.find((role) => role.shortName === 'owner')
      return displayName ? displayName.name : 'Owner'
    }
  }, [entryRoles])

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} />
  }

  if (isEntryRolesLoading) {
    return <Loading />
  }

  return <span>{ownerRoleDisplayName}</span>
}
