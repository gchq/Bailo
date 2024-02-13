import MessageAlert from 'src/MessageAlert'

import Wrapper from '../Wrapper'

type ErrorWrapperProps = {
  message?: string
}

export default function ErrorWrapper({ message }: ErrorWrapperProps) {
  return (
    <Wrapper title='Error' page='error'>
      <MessageAlert message={message || 'Unable to communicate with server.'} severity='error' />
    </Wrapper>
  )
}
