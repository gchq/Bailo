import axios from 'axios'
import useSWR from 'swr'
import { EntryCardInterface, EntryCardRevisionInterface } from 'types/types'
import { handleAxiosError } from 'utils/axios'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyModelCardRevisionsList = []

export async function postFromSchema(modelId: string, schemaId: string) {
  try {
    const response = await axios({
      method: 'post',
      url: `/api/v2/model/${modelId}/setup/from-schema`,
      headers: { 'Content-Type': 'application/json' },
      data: { schemaId },
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}

export async function postFromTemplate(modelId: string, templateId: string) {
  return fetch(`/api/v2/model/${modelId}/setup/from-template`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId }),
  })
}

export async function putModelCard(modelId: string, metadata: unknown) {
  try {
    const response = await axios({
      method: 'put',
      url: `/api/v2/model/${modelId}/model-cards`,
      headers: { 'Content-Type': 'application/json' },
      data: { metadata: metadata },
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}

export function useGetEntryCard(entryId?: string, entryCardVersion?: number) {
  const { data, isLoading, error } = useSWR<
    {
      modelCard: EntryCardInterface
    },
    ErrorInfo
  >(entryId && entryCardVersion ? `/api/v2/model/${entryId}/model-card/${entryCardVersion}` : null, fetcher)

  return {
    entryCard: data ? data.modelCard : undefined,
    isEntryCardLoading: isLoading,
    isEntryCardError: error,
  }
}

export function useGetModelCardRevisions(modelId: string) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      modelCardRevisions: EntryCardRevisionInterface[]
    },
    ErrorInfo
  >(`/api/v2/model/${modelId}/model-card-revisions`, fetcher)

  return {
    mutateModelCardRevisions: mutate,
    modelCardRevisions: data ? data.modelCardRevisions : emptyModelCardRevisionsList,
    isModelCardRevisionsLoading: isLoading,
    isModelCardRevisionsError: error,
  }
}
