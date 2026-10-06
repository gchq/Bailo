import { ReactElement } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { ErrorInfo } from 'utils/fetcher'

export default function renderQueryState(errors: (ErrorInfo | undefined)[], isLoading: boolean): ReactElement | null {
  for (const error of errors) {
    if (error) {
      return <MessageAlert message={error.info.message} severity='error' />
    }
  }
  if (isLoading) {
    return <Loading />
  }
  return null
}
