import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { utils } from '@rjsf/core'
import React from 'react'
import ArrayFieldTemplate from '../ArrayFieldTemplate/index.js'
import ErrorList from '../ErrorList/index.js'
import Fields from '../Fields/index.js'
import FieldTemplate from '../FieldTemplate/index.js'
import ObjectFieldTemplate from '../ObjectFieldTemplate/index.js'
import Widgets from '../Widgets/index.js'

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
