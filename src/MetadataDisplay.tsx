import React, { useEffect, useState } from 'react'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import { printProperty } from '../utils/propertyUtils'
import CommonTabs from './common/CommonTabs'
import { useGetSchemas } from '../data/schema'
import useTheme from '@mui/styles/useTheme'
import { lightTheme } from '../src/theme'

const MetadataDisplay = ({
  item,
  tabsDisplaySequentially,
  use,
}: {
  item: any
  tabsDisplaySequentially: boolean
  use: any
}) => {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(use)
  const propertiesToIgnore = ['id', 'timeStamp', 'schemaRef', 'schemaVersion', 'user']

  const [schema, setSchema] = useState<any | undefined>(undefined)
  const [sectionKeys, setSectionKeys] = useState<string[]>([])

  const theme: any = useTheme() || lightTheme

  useEffect(() => {
    if (!schemas) return

    const currentSchema = schemas.filter(({ reference }) => reference == item.schemaRef)[0].schema
    const keys = Object.keys(currentSchema.properties).filter(
      (sectionName) => !propertiesToIgnore.includes(sectionName)
    )

    setSchema(currentSchema)
    setSectionKeys(keys)
  }, [schemas, setSchema, setSectionKeys])

  if (isSchemasLoading) {
    return (
      <Typography variant='body1' component='p'>
        Loading Schemas
      </Typography>
    )
  }

  if (isSchemasError) {
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
        <div>{printProperty(value, true, true, true, format)}</div>
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
              <div key={'dataset ' + (i + 1)}>
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
    if (!schema || !schema.properties || !item) {
      return null
    }

    return sectionKeys.map((key, i) => {
      const divider = i + 1 < sectionKeys.length ? <Divider variant='middle' sx={{ mt: 2, mb: 4 }} /> : null

      return schema.properties[key] ? (
        <div key={key}>
          <div id={`${key}-section-id`}>
            {heading(`${schema.properties[key].title}`)}
            {printProps(schema.properties[key], item[key])}
          </div>
          {divider}
        </div>
      ) : null
    })
  }
  return (
    <Box sx={{ p: 4, backgroundColor: theme.palette.mode === 'light' ? '#f3f1f1' : '#5a5a5a', borderRadius: 2 }}>
      {printSections()}
    </Box>
  )
}

export default MetadataDisplay
