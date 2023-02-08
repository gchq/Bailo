import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { utils } from '@rjsf/core'
import React from 'react'
import ArrayFieldTemplate from '../ArrayFieldTemplate.js'
import ErrorList from '../ErrorList.js'
import Fields from '../Fields.js'
import FieldTemplate from '../FieldTemplate.js'
import ObjectFieldTemplate from '../ObjectFieldTemplate.js'
import Widgets from '../Widgets.js'

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
