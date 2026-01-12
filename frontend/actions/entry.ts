import qs from 'querystring'
import useSWR from 'swr'

import {
  BailoError,
  EntryForm,
  EntryInterface,
  EntryKindKeys,
  EntryUserPermissions,
  EntryVisibilityKeys,
  FileInterface,
  ModelImage,
  ReleaseInterface,
  SystemRole,
} from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

const emptyEntryList = []

export interface EntrySearchResult {
  id: string
  name: string
  description: string
  tags: Array<string>
  kind: EntryKindKeys
  organisation?: string
  state?: string
  peerId?: string
  visibility: EntryVisibilityKeys
  createdAt: Date
  updatedAt: Date
  sourceModelId?: string
}

export interface ModelExportRequest {
  disclaimerAgreement: boolean
  semvers?: ReleaseInterface['semver'][]
}

export function useListEntries(
  kind?: EntryKindKeys,
  roles: string[] = [],
  task = '',
  libraries: string[] = [],
  organisations: string[] = [],
  states: string[] = [],
  peers: string[] = [],
  search = '',
  allowTemplating?: boolean,
  schemaId?: string,
  titleOnly?: boolean,
  adminAccess?: boolean,
) {
  const queryParams = {
    ...(kind && { kind }),
    ...(roles.length > 0 && { filters: roles }),
    ...(task && { task }),
    ...(libraries.length > 0 && { libraries }),
    ...(organisations.length > 0 && { organisations }),
    ...(states.length > 0 && { states }),
    ...(peers.length > 0 && { peers }),
    ...(search && { search }),
    ...(allowTemplating && { allowTemplating }),
    ...(schemaId && { schemaId }),
    ...(titleOnly && { titleOnly }),
    ...(adminAccess && { adminAccess }),
  }
  const { data, isLoading, error, mutate } = useSWR<
    {
      models: EntrySearchResult[]
      errors: Record<string, BailoError>
    },
    ErrorInfo
  >(Object.entries(queryParams).length > 0 ? `/api/v2/models/search?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateEntries: mutate,
    entries: data ? data.models : emptyEntryList,
    entryErrors: data ? data.errors : {},
    isEntriesLoading: isLoading,
    isEntriesError: error,
  }
}

export function useGetEntry(entryId: string | undefined, kind?: EntryKindKeys) {
  const queryParams = {
    ...(kind && { kind }),
  }

  const { data, isLoading, error, mutate } = useSWR<
    {
      model: EntryInterface
    },
    ErrorInfo
  >(entryId ? `/api/v2/model/${entryId}?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateEntry: mutate,
    entry: data?.model,
    isEntryLoading: isLoading,
    isEntryError: error,
  }
}

const emptyRolesList = []

export function useGetEntryRoles(entryId?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      roles: SystemRole[]
    },
    ErrorInfo
  >(entryId ? `/api/v2/roles?modelId=${entryId}` : `/api/v2/roles`, fetcher)

  return {
    mutateEntryRoles: mutate,
    entryRoles: data ? data.roles : emptyRolesList,
    isEntryRolesLoading: isLoading,
    isEntryRolesError: error,
  }
}

const emptyImageList = []

export function useGetModelImages(modelId?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      images: ModelImage[]
    },
    ErrorInfo
  >(modelId ? `/api/v2/model/${modelId}/images` : null, fetcher)

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

export function useGetModelFiles(entryId?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      files: Array<FileInterface>
    },
    ErrorInfo
  >(entryId ? `/api/v2/model/${entryId}/files` : null, fetcher)

  return {
    mutateModelFiles: mutate,
    modelFiles: data ? data.files : [],
    isModelFilesLoading: isLoading,
    isModelFilesError: error,
  }
}

export function deleteEntryFile(modelId: string, fileId: string) {
  return fetch(`/api/v2/model/${modelId}/file/${fileId}`, {
    method: `delete`,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function postEntry(form: EntryForm) {
  return fetch(`/api/v2/models`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
}

export async function patchEntry(
  entryId: string,
  delta: Partial<
    Pick<
      EntryInterface,
      'name' | 'description' | 'collaborators' | 'visibility' | 'settings' | 'organisation' | 'state' | 'tags'
    >
  >,
) {
  return fetch(`/api/v2/model/${entryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(delta),
  })
}

export async function deleteEntry(entryId: string) {
  return fetch(`/api/v2/model/${entryId}`, {
    method: 'delete',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function postEntryExportToS3(entryId: string, modelExport: ModelExportRequest) {
  return fetch(`/api/v2/model/${entryId}/export/s3`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(modelExport),
  })
}

export function useGetPopularEntryTags() {
  const { data, isLoading, error, mutate } = useSWR<
    {
      tags: string[]
    },
    ErrorInfo
  >('/api/v2/models/tags', fetcher)

  return {
    mutateTags: mutate,
    tags: data ? data.tags : [],
    isTagsLoading: isLoading,
    isTagsError: error,
  }
}
