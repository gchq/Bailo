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

      if (error.info && error.info.message) {
        // error.info.message will exist when the server
        // throws errors at us.
        return <ErrorWrapper message={error.info.message} />
      }

      // the generic error is used when we can't reach
      // the server (e.g. due to internal exception / network error)
      return <ErrorWrapper message={generic} />
    }
  }

  return undefined
}
