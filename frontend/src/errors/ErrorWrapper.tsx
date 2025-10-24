import Title from 'src/common/Title'
import MessageAlert from 'src/MessageAlert'

type ErrorWrapperProps = {
  message?: string
  id?: string
  code?: number
  status?: number
}

export default function ErrorWrapper({ message, id, code, status }: ErrorWrapperProps) {
  return (
    <>
      <Title text='Error' />
      <MessageAlert
        id={id || ''}
        code={code}
        status={status}
        message={message || 'Unable to communicate with server.'}
        severity='error'
        data-test='errorWrapperMessage'
      />
    </>
  )
}
