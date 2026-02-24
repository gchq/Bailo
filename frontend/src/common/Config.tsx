/**
 * Dynamically generated config docs for frontend pages.
 *
 * See also: `lib/landing/pages/src/Config.static.tsx` for static implementation.
 */

import { useGetConfigDocs } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import ConfigProperty from 'src/docs/ConfigProperty'
import ErrorWrapper from 'src/errors/ErrorWrapper'

export default function Config() {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetConfigDocs()

  if (isUiConfigError) {
    return <ErrorWrapper message={isUiConfigError.info.message} />
  }

  if (isUiConfigLoading) {
    return <Loading />
  }

  return (
    <>
      {uiConfig &&
        uiConfig.map((property) => (
          <ConfigProperty key={property.name} name={property.name} type={property.type} doc={property.doc}>
            {property.children}
          </ConfigProperty>
        ))}
    </>
  )
}
