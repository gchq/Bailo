import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { utils } from '@rjsf/core'
import React from 'react'
import ArrayFieldTemplate from '../ArrayFieldTemplate'
import ErrorList from '../ErrorList'
import Fields from '../Fields'
import FieldTemplate from '../FieldTemplate'
import ObjectFieldTemplate from '../ObjectFieldTemplate'
import Widgets from '../Widgets'

const { getDefaultRegistry } = utils

const { fields, widgets } = getDefaultRegistry()

function DefaultChildren() {
  return (
    <Box marginTop={3}>
      <Button type='submit' variant='contained' color='primary'>
        Submit
      </Button>
    </Box>
  )
}

const Theme: any = {
  children: <DefaultChildren />,
  ArrayFieldTemplate,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  widgets: { ...widgets, ...Widgets },
  ErrorList,
}

export default Theme
