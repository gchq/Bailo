import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import React, { useEffect, useState } from 'react'

import { useGetSchema } from '../data/schema'
import { printProperty } from '../utils/propertyUtils'
import CommonTabs from './common/CommonTabs'

function MetadataDisplay({
  item,
  tabsDisplaySequentially,
  use,
}: {
  item: any
  tabsDisplaySequentially: boolean
  use: any
}) {
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(item.schemaRef)

  const [currentSchema, setCurrentSchema] = useState<any | undefined>(undefined)
  const [sectionKeys, setSectionKeys] = useState<string[]>([])

  const theme = useTheme()

  useEffect(() => {
    if (!schema) return

    const propertiesToIgnore = ['id', 'timeStamp', 'schemaRef', 'schemaVersion', 'user', 'contacts']

    const currentSchema = schema.schema
    const keys = Object.keys(currentSchema.properties).filter(
      (sectionName) =>
        !propertiesToIgnore.includes(sectionName) && currentSchema.properties[sectionName].displayModelCard !== false
    )

    setCurrentSchema(currentSchema)
    setSectionKeys(keys)
  }, [schema, setCurrentSchema, setSectionKeys, item])

  if (isSchemaLoading) {
    return (
      <Typography variant='body1' component='p'>
        Loading Schemas
      </Typography>
    )
  }

  if (isSchemaError) {
    return (
      <Typography variant='body1' component='p'>
        Error Loading Schemas
      </Typography>
    )
  }

  const heading = (text: any) => (
    <Typography variant='h4' color='textPrimary'>
      {text}
    </Typography>
  )

  const subHeading = (text: any) => (
    <Typography variant='subtitle2' color='textSecondary'>
      {text}
    </Typography>
  )

  const printProp = (schemaPart: any, modelPart: any, format: any) => {
    let value = modelPart

    if (schemaPart.enum && schemaPart.enumNames) {
      const index = schemaPart.enum.indexOf(value)
      if (index >= 0) {
        value = schemaPart.enumNames[index]
      }
    }

    return schemaPart ? (
      <Box sx={{ p: 2 }}>
        {subHeading(schemaPart.title)}
        <div>
          <Typography style={{ whiteSpace: 'pre-wrap' }}>{printProperty(value, true, true, true, format)}</Typography>
        </div>
      </Box>
    ) : null
  }

  const printProps = (schemaPart: any, modelPart: any) => {
    if (!schemaPart) {
      return null
    }

    if (schemaPart.properties) {
      return Object.keys(schemaPart.properties).map((propKey, i) => (
        <div key={`${i + 1}`}>{printProps(schemaPart.properties[propKey], modelPart ? modelPart[propKey] : null)}</div>
      ))
    }

    if (schemaPart.type === 'array') {
      if (schemaPart.items.type === 'string') {
        return printProp(schemaPart, modelPart, schemaPart.format)
      }

      if (schemaPart.items.properties && Object.keys(schemaPart.items.properties).length <= 2) {
        return printProp(schemaPart, modelPart, schemaPart.format)
      }

      const tabs =
        modelPart && modelPart.length > 0
          ? modelPart.map((modelItem: any, i: any) => (
              <div key={`${i + 1}`}>{printProps(schemaPart.items, modelItem)}</div>
            ))
          : []

      return (
        <Box sx={{ mt: 4 }}>
          {tabsDisplaySequentially &&
            tabs.map((tab: any, i: any) => (
              <div key={`dataset ${i + 1}`}>
                <Typography sx={{ p: 2 }} variant='h5'>
                  Dataset #{i + 1}
                </Typography>
                <div>{tab}</div>
              </div>
            ))}
          {!tabsDisplaySequentially && <CommonTabs tabs={tabs} tabName={schemaPart.items.title || schemaPart.title} />}
          {tabs.length === 0 && <Box sx={{ p: 2 }}>No values</Box>}
        </Box>
      )
    }

    return printProp(schemaPart, modelPart, schemaPart.format)
  }

  const printSections = () => {
    if (!currentSchema || !currentSchema.properties || !item) {
      return null
    }

    return sectionKeys.map((key, i) => {
      const divider = i + 1 < sectionKeys.length ? <Divider variant='middle' sx={{ mt: 2, mb: 4 }} /> : null

      return currentSchema.properties[key] ? (
        <div key={key}>
          <div id={`${key}-section-id`}>
            {heading(`${currentSchema.properties[key].title}`)}
            {printProps(currentSchema.properties[key], item[key])}
          </div>
          {divider}
        </div>
      ) : null
    })
  }
  return (
    <Box sx={{ p: 4, backgroundColor: theme.palette.container.main, borderRadius: 2 }} data-test='metadataDisplay'>
      {printSections()}
    </Box>
  )
}

export default MetadataDisplay
