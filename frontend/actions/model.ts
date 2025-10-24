import qs from 'querystring'
import useSWR from 'swr'

import {
  EntryForm,
  EntryInterface,
  EntryKindKeys,
  EntryUserPermissions,
  FileInterface,
  ModelImage,
  ReleaseInterface,
  SystemRole,
} from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

const emptyModelList = []

export interface EntrySearchResult {
  id: string
  name: string
  description: string
  tags: Array<string>
  kind: EntryKindKeys
  organisation?: string
  state?: string
  createdAt: Date
  updatedAt: Date
}

export interface ModelExportRequest {
  disclaimerAgreement: boolean
  semvers?: ReleaseInterface['semver'][]
}

//This function is misleading, it gets a list of entries (models, data cards, etc.), not just models.
//This is tech debt that is repeating throughout this file and other parts of the codebase.
export function useListModels(
  kind?: EntryKindKeys,
  filters: string[] = [],
  task = '',
  libraries: string[] = [],
  organisations: string[] = [],
  states: string[] = [],
  search = '',
  allowTemplating?: boolean,
  schemaId?: string,
) {
  const queryParams = {
    ...(kind && { kind }),
    ...(filters.length > 0 && { filters }),
    ...(task && { task }),
    ...(libraries.length > 0 && { libraries }),
    ...(organisations.length > 0 && { organisations }),
    ...(states.length > 0 && { states }),
    ...(search && { search }),
    ...(allowTemplating && { allowTemplating }),
    ...(schemaId && { schemaId }),
  }
  const { data, isLoading, error, mutate } = useSWR<
    {
      models: EntrySearchResult[]
    },
    ErrorInfo
  >(Object.entries(queryParams).length > 0 ? `/api/v2/models/search?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateModels: mutate,
    models: data ? data.models : emptyModelList,
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
    model: data?.model,
    isModelLoading: isLoading,
    isModelError: error,
  }
}

const emptyRolesList = []

export function useGetModelRoles(id?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      roles: SystemRole[]
    },
    ErrorInfo
  >(id ? `/api/v2/roles?modelId=${id}` : `/api/v2/roles`, fetcher)

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

export function useGetCurrentUserPermissionsForEntry(entryId?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      permissions: EntryUserPermissions
    },
    ErrorInfo
  >(entryId ? `/api/v2/model/${entryId}/permissions/mine` : null, fetcher)

  return {
    mutateEntryUserPermissions: mutate,
    entryUserPermissions: data?.permissions,
    isEntryUserPermissionsLoading: isLoading,
    isEntryUserPermissionsError: error,
  }
}

export function useGetModelFiles(id?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      files: Array<FileInterface>
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/files` : null, fetcher)

  return {
    mutateEntryFiles: mutate,
    entryFiles: data ? data.files : [],
    isEntryFilesLoading: isLoading,
    isEntryFilesError: error,
  }
}

export function deleteModelFile(modelId: string, fileId: string) {
  return fetch(`/api/v2/model/${modelId}/file/${fileId}`, {
    method: `delete`,
    headers: { 'Content-Type': 'application/json' },
  })
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
  delta: Partial<
    Pick<
      EntryInterface,
      'name' | 'description' | 'collaborators' | 'visibility' | 'settings' | 'organisation' | 'state' | 'tags'
    >
  >,
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
