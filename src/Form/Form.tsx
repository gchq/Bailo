import { useState } from 'react'

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'

import { Step } from '../../types/interfaces'

import FormDesigner from './FormDesigner'
import FormUpload from './FormUpload'

export default function Form({
  steps,
  setSteps,
  onSubmit,
}: {
  steps: Array<Step>
  onSubmit: Function
  setSteps: Function
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
          <Tab label='Upload Existing' value='upload' />
        </Tabs>
      </Box>

      {tab === 'designer' && <FormDesigner steps={steps} setSteps={setSteps} onSubmit={onSubmit} />}
      {tab === 'upload' && <FormUpload steps={steps} setSteps={setSteps} onSubmit={onSubmit} />}
    </>
  )
}
