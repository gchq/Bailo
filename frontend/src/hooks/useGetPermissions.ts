import { useContext, useEffect } from 'react'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'

export const useGetPermissions = (entryId?: string, accessRequestId?: string) => {
  const { setAccessRequestId, setEntryId } = useContext(UserPermissionsContext)

  useEffect(() => {
    if (accessRequestId) {
      setAccessRequestId(accessRequestId)
    }
    if (entryId) {
      setEntryId(entryId)
    }
    return () => {
      setAccessRequestId(undefined)
      setEntryId(undefined)
    }
  }, [accessRequestId, entryId, setAccessRequestId, setEntryId])
}
