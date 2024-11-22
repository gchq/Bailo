import useSWR from 'swr'
import { AccessRequestInterface, AccessRequestUserPermissions } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyAccessRequestList = []

export function useGetAccessRequestsForModelId(modelId?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      accessRequests: AccessRequestInterface[]
    },
    ErrorInfo
  >(modelId ? `/api/v2/model/${modelId}/access-requests` : null, fetcher)

  return {
    mutateAccessRequests: mutate,
    accessRequests: data ? data.accessRequests : emptyAccessRequestList,
    isAccessRequestsLoading: isLoading,
    isAccessRequestsError: error,
  }
}

export function useGetAccessRequest(modelId: string | undefined, accessRequestId: string | undefined) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      accessRequest: AccessRequestInterface
    },
    ErrorInfo
  >(accessRequestId && modelId ? `/api/v2/model/${modelId}/access-request/${accessRequestId}` : null, fetcher)

  return {
    mutateAccessRequest: mutate,
    accessRequest: data?.accessRequest,
    isAccessRequestLoading: isLoading,
    isAccessRequestError: error,
  }
}

export function useGetCurrentUserPermissionsForAccessRequest(entryId?: string, accessRequestId?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      permissions: AccessRequestUserPermissions
    },
    ErrorInfo
  >(
    entryId && accessRequestId ? `/api/v2/model/${entryId}/access-request/${accessRequestId}/permissions/mine` : null,
    fetcher,
  )

  return {
    mutateAccessRequestUserPermissions: mutate,
    accessRequestUserPermissions: data?.permissions,
    isAccessRequestUserPermissionsLoading: isLoading,
    isAccessRequestUserPermissionsError: error,
  }
}

export function postAccessRequest(modelId: string, schemaId: string, form: Record<string, unknown>) {
  return fetch(`/api/v2/model/${modelId}/access-requests`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata: { ...form }, schemaId: schemaId }),
  })
}

export function deleteAccessRequest(modelId: string, accessRequestId: string) {
  return fetch(`/api/v2/model/${modelId}/access-request/${accessRequestId}`, {
    method: 'delete',
    headers: { 'Content-Type': 'application/json' },
  })
}

export function patchAccessRequest(modelId: string, accessRequestId: string, form: Record<string, unknown>) {
  return fetch(`/api/v2/model/${modelId}/access-request/${accessRequestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata: { ...form } }),
  })
}

export function postAccessRequestComment(modelId: string, accessRequestId: string, comment: string) {
  return fetch(`/api/v2/model/${modelId}/access-request/${accessRequestId}/comment`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  })
}
