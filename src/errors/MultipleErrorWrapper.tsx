import DefaultErrorWrapper from './ErrorWrapper'

export default function MultipleErrorWrapper(generic: string, errors: any, ErrorWrapper: any = DefaultErrorWrapper) {
  for (let key in errors) {
    if (errors[key]) {
      const error = errors[key]

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
