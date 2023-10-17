import useSWR from 'swr'
import { AccessRequestInterface } from 'types/interfaces'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const testAccessRequest1: AccessRequestInterface = {
  id: 'testRequestId1',
  modelId: 'testModelId',
  schemaId: 'testSchemaId',
  deleted: false,
  metadata: {
    overview: {
      name: 'Test Access Request 1',
      entities: ['Fred Smith', 'Bob Smith', 'Maria Smith', 'Tim Smith', 'Hello World', 'Jonathan Stephenson'],
      hasEndDate: true,
      endDate: '2024-10-11T13:29:39.881Z',
    },
  },
  createdBy: 'user',
  createdAt: '2023-10-11T13:29:39.881Z',
  updatedAt: '2023-11-20T14:21:53.881Z',
}

const testAccessRequest2 = {
  ...testAccessRequest1,
  id: 'testRequestId2',
  metadata: {
    overview: {
      name: 'Test Access Request 2',
      entities: ['Ellie Smith', 'Mark Smith', 'Helen Johnson', 'Mike Big'],
      hasEndDate: false,
    },
  },
  createdBy: 'Mike Smith',
  createdAt: '2022-08-11T13:29:39.881Z',
  updatedAt: '2022-09-20T14:21:53.881Z',
}

export function useGetAccessRequestsForModelId(modelId?: string) {
  const { data, error, mutate } = useSWR<
    {
      accessRequests: AccessRequestInterface[] // TODO me - double check data.accessRequests is correct once endpoint is live
    },
    ErrorInfo
  >(modelId ? `/api/v2/model/${modelId}/access-requests` : null, fetcher) // TODO me - check this is right when GET access requests endpoint is added

  return {
    mutateAccessRequests: mutate,
    accessRequests: data ? data.accessRequests : [testAccessRequest1, testAccessRequest2],
    isAccessRequestsLoading: !error && !data,
    isAccessRequestsError: error,
  }
}
