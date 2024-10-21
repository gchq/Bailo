import qs from 'querystring'
import useSWR from 'swr'

import { EntryForm, EntryInterface, EntryKindKeys, ModelImage, Role } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

const emptyModelList = []

export interface EntrySearchResults {
  models: EntrySearchResult[]
  totalEntries: number
}

export interface EntrySearchResult {
  id: string
  name: string
  description: string
  tags: Array<string>
  kind: EntryKindKeys
}

export interface ModelExportRequest {
  disclaimerAgreement: boolean
}

export function useListModels(
  kind?: EntryKindKeys,
  filters: string[] = [],
  task = '',
  libraries: string[] = [],
  search = '',
  allowTemplating?: boolean,
  schemaId?: string,
  currentPage?: number | string,
  pageSize?: number | string,
) {
  const queryParams = {
    ...(kind && { kind }),
    ...(filters.length > 0 && { filters }),
    ...(task && { task }),
    ...(libraries.length > 0 && { libraries }),
    ...(search && { search }),
    ...(allowTemplating && { allowTemplating }),
    ...(schemaId && { schemaId }),
    ...(currentPage && { currentPage }),
    ...(pageSize && { pageSize }),
  }
  const { data, isLoading, error, mutate } = useSWR<EntrySearchResults, ErrorInfo>(
    Object.entries(queryParams).length > 0 ? `/api/v2/models/search?${qs.stringify(queryParams)}` : null,
    fetcher,
  )

  return {
    mutateModels: mutate,
    models: data ? data.models : emptyModelList,
    totalModels: data ? data.totalEntries : 0,
    isModelsLoading: isLoading,
    isModelsError: error,
  }
}

export function useGetModel(id: string | undefined, kind: EntryKindKeys) {
  const queryParams = {
    kind,
  }

  const { data, isLoading, error, mutate } = useSWR<
    {
      model: EntryInterface
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateModel: mutate,
    model: data ? data.model : undefined,
    isModelLoading: isLoading,
    isModelError: error,
  }
}

const emptyRolesList = []

export function useGetModelRoles(id?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      roles: Role[]
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/roles` : null, fetcher)

  return {
    mutateModelRoles: mutate,
    modelRoles: data ? data.roles : emptyRolesList,
    isModelRolesLoading: isLoading,
    isModelRolesError: error,
  }
}

const emptyImageList = []

export function useGetModelImages(id?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      images: ModelImage[]
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/images` : null, fetcher)

  return {
    mutateModelImages: mutate,
    modelImages: data ? data.images : emptyImageList,
    isModelImagesLoading: isLoading,
    isModelImagesError: error,
  }
}

const emptyMyRolesList = []

export function useGetModelRolesCurrentUser(id?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      roles: Role[]
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/roles/mine` : null, fetcher)

  return {
    mutateModelRolesCurrentUser: mutate,
    modelRolesCurrentUser: data ? data.roles : emptyMyRolesList,
    isModelRolesCurrentUserLoading: isLoading,
    isModelRolesCurrentUserError: error,
  }
}

export async function postModel(form: EntryForm) {
  return fetch(`/api/v2/models`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
}

export async function patchModel(
  id: string,
  delta: Partial<Pick<EntryInterface, 'name' | 'description' | 'collaborators' | 'visibility' | 'settings'>>,
) {
  return fetch(`/api/v2/model/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(delta),
  })
}

export async function postModelExportToS3(id: string, modelExport: ModelExportRequest) {
  return fetch(`/api/v2/model/${id}/export/s3`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(modelExport),
  })
}
