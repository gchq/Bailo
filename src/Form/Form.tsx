import { Dispatch, SetStateAction, useState } from 'react'

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import useTheme from '@mui/styles/useTheme'

import { SplitSchema, Step } from '../../types/interfaces'

import FormDesigner from './FormDesigner'
import FormUpload from './FormUpload'
import { lightTheme } from '../theme'

export default function Form({
  splitSchema,
  setSplitSchema,
  onSubmit,
  modelUploading,
}: {
  splitSchema: SplitSchema
  onSubmit: Function
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
  modelUploading?: boolean
}) {
  const [tab, setTab] = useState('designer')
  const onTabChange = (_event: any, newValue: any) => {
    setTab(newValue)
  }

  const theme: any = useTheme() || lightTheme

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          indicatorColor='secondary'
          textColor={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
          value={tab}
          onChange={onTabChange}
        >
          <Tab label='Designer' value='designer' />
          <Tab label='Upload Existing' value='upload' data-test='uploadJsonTab' />
        </Tabs>
      </Box>

      {tab === 'designer' && (
        <FormDesigner
          splitSchema={splitSchema}
          setSplitSchema={setSplitSchema}
          onSubmit={onSubmit}
          modelUploading={modelUploading}
        />
      )}
      {tab === 'upload' && <FormUpload splitSchema={splitSchema} setSplitSchema={setSplitSchema} onSubmit={onSubmit} />}
    </>
  )
}
