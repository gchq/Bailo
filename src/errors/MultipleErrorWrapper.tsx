import DefaultErrorWrapper from './ErrorWrapper'

export default function MultipleErrorWrapper(generic: string, errors: any, ErrorWrapper: any = DefaultErrorWrapper) {
  for (const key of Object.keys(errors)) {
    // eslint-disable-next-line react/destructuring-assignment
    const error = errors[key]

    if (error) {
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
