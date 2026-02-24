import ConfigProperty from '../src/docs/ConfigProperty'

import configDocs from '../public/config/config-docs.json'
import React from 'react'

export default function Config() {
  const { config } = configDocs

  return (
    <>
      {config.map((property) => (
        <ConfigProperty key={property.name} name={property.name} type={property.type} doc={property.doc}>
          {property.children}
        </ConfigProperty>
      ))}
    </>
  )
}
