import qs from 'querystring'
import useSWR from 'swr'

import {
  BailoError,
  EntryForm,
  EntryImage as EntryImage,
  EntryInterface,
  EntryKindKeys,
  EntryUserPermissions,
  EntryVisibilityKeys,
  FileInterface,
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
      entries: EntrySearchResult[]
      errors: Record<string, BailoError>
    },
    ErrorInfo
  >(Object.entries(queryParams).length > 0 ? `/api/v2/models/search?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateEntries: mutate,
    entries: data ? data.entries : emptyEntryList,
    errors: data ? data.errors : {},
    isEntriesLoading: isLoading,
    isEntriesError: error,
  }
}

export function useGetModel(id: string | undefined, kind?: EntryKindKeys) {
  const queryParams = {
    ...(kind && { kind }),
  }

  const { data, isLoading, error, mutate } = useSWR<
    {
      entries: EntryInterface
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateEntries: mutate,
    entries: data?.entries,
    isEntryLoading: isLoading,
    isEntryError: error,
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
    mutateEntryRoles: mutate,
    entryRoles: data ? data.roles : emptyRolesList,
    isEntryRolesLoading: isLoading,
    isEntryRolesError: error,
  }
}

const emptyImageList = []

export function useGetModelImages(id?: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      images: EntryImage[]
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/images` : null, fetcher)

  return {
    mutateEntryImages: mutate,
    entryImages: data ? data.images : emptyImageList,
    isEntryImagesLoading: isLoading,
    isEntryImagesError: error,
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

export async function deleteModel(id: string) {
  return fetch(`/api/v2/model/${id}`, {
    method: 'delete',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function postModelExportToS3(id: string, modelExport: ModelExportRequest) {
  return fetch(`/api/v2/model/${id}/export/s3`, {
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
