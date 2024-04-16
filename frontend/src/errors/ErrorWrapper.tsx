import Title from 'src/common/Title'
import MessageAlert from 'src/MessageAlert'

type ErrorWrapperProps = {
  message?: string
}

export default function ErrorWrapper({ message }: ErrorWrapperProps) {
  return (
    <>
      <Title title='Error' />
      <MessageAlert
        message={message || 'Unable to communicate with server.'}
        severity='error'
        data-test='errorWrapperMessage'
      />
    </>
  )
}
