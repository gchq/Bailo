import { useMemo } from 'react'
import { EntryRole } from 'types/types'

interface OwnerRoleDisplayProps {
  entryRoles: EntryRole[]
}

export default function OwnerRoleDisplay({ entryRoles }: OwnerRoleDisplayProps) {
  const ownerRoleDisplayName = useMemo(() => {
    if (entryRoles) {
      const displayName = entryRoles.find((role) => role.shortName === 'owner')
      return displayName ? displayName.name : 'Owner'
    }
  }, [entryRoles])

  return <span>{ownerRoleDisplayName}</span>
}
