import { AxiosResponse } from 'axios'

export const isSuccessResponse = (response: AxiosResponse): boolean => response.status >= 200 && response.status < 400
