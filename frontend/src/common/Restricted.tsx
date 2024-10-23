import { Tooltip } from '@mui/material'
import { ReactElement, useContext, useMemo } from 'react'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import { RestrictedActionKeys } from 'types/types'

type RestrictedProps = {
  action: RestrictedActionKeys
  fallback?: ReactElement
  children: ReactElement
}

export default function Restricted({ action, fallback, children }: RestrictedProps) {
  const { userPermissions } = useContext(UserPermissionsContext)

  const permission = useMemo(() => userPermissions[action], [action, userPermissions])

  if (permission.hasPermission) {
    return <>{children}</>
  }

  if (fallback) {
    return (
      <Tooltip title={permission.info}>
        <div>{fallback}</div>
      </Tooltip>
    )
  }

  return null
}
