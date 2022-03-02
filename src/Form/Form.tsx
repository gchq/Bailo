import { Dispatch, SetStateAction, useState } from 'react'

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'

import { SplitSchema, Step } from '../../types/interfaces'

import FormDesigner from './FormDesigner'
import FormUpload from './FormUpload'

export default function Form({
  splitSchema,
  setSplitSchema,
  onSubmit,
}: {
  splitSchema: SplitSchema
  onSubmit: Function
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
}) {
  const [tab, setTab] = useState('designer')
  const onTabChange = (_event: any, newValue: any) => {
    setTab(newValue)
  }

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs indicatorColor='secondary' value={tab} onChange={onTabChange}>
          <Tab label='Designer' value='designer' />
          <Tab label='Upload Existing' value='upload' data-test='uploadJsonTab' />
        </Tabs>
      </Box>

      {tab === 'designer' && <FormDesigner splitSchema={splitSchema} setSplitSchema={setSplitSchema} onSubmit={onSubmit} />}
      {tab === 'upload' && <FormUpload splitSchema={splitSchema} setSplitSchema={setSplitSchema} onSubmit={onSubmit} />}
    </>
  )
}
