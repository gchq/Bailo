import React from 'react'
import Forbidden from 'src/common/Forbidden'

import DefaultErrorWrapper from './ErrorWrapper'

export default function MultipleErrorWrapper(generic: string, errors: any, ErrorWrapper: any = DefaultErrorWrapper) {
  for (const key of Object.keys(errors)) {
    const error = errors[key]

    if (error) {
      if (error.status === 403) {
        return <Forbidden errorMessage='If you think this is in error please contact the model owners.' />
      }

      const message = error?.message || error?.info?.message || generic

      return <ErrorWrapper id={key} message={message} status={error?.status} code={error?.code} />
    }
  }

  return undefined
}
