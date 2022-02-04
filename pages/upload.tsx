import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import Wrapper from '../src/Wrapper'
import { useGetDefaultSchema, useGetSchemas } from '../data/schema'
import MultipleErrorWrapper from '../src/errors/MultipleErrorWrapper'
import { Schema, Step } from '../types/interfaces'
import { createStep, getStepsData, getStepsFromSchema, setStepState } from '../utils/formUtils'
import FileInput from '../src/common/FileInput'

import SchemaSelector from '../src/Form/SchemaSelector'
import SubmissionError from '../src/Form/SubmissionError'
import Form from '../src/Form/Form'

function renderFileTab(step: Step, steps: Array<Step>, setSteps: Function) {
  const { state } = step
  const { binary, code } = state

  const handleCodeChange = (e: any) => {
    setStepState(steps, setSteps, step, { ...state, code: e.target.files[0] })
  }

  const handleBinaryChange = (e: any) => {
    setStepState(steps, setSteps, step, { ...state, binary: e.target.files[0] })
  }

  return (
    <Box sx={{ pb: 4, pt: 4 }}>
      <Stack direction='row' spacing={2} alignItems='center'>
        <FileInput
          label={'Select Code'}
          file={code}
          onChange={handleCodeChange}
          accepts='.zip'
        />
        <FileInput
          label={'Select Binary'}
          file={binary}
          onChange={handleBinaryChange}
          accepts='.zip'
        />
      </Stack>
    </Box>
  )
}

function Upload() {
  const { defaultSchema, isDefaultSchemaError, isDefaultSchemaLoading } = useGetDefaultSchema('UPLOAD')
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas('UPLOAD')

  const router = useRouter()
  
  const [currentSchema, setCurrentSchema] = useState<Schema | undefined>(undefined)
  const [steps, setSteps] = useState<Array<Step>>([])
  const [error, setError] = useState<string | undefined>(undefined)

  console.log('outer steps', steps)

  const errorWrapper = MultipleErrorWrapper(`Unable to load upload page`, {
    isDefaultSchemaError,
    isSchemasError,
  })
  if (errorWrapper) return errorWrapper

  useEffect(() => {
    setCurrentSchema(defaultSchema)
  }, [defaultSchema])

  useEffect(() => {
    if (!currentSchema) return
    
    const { schema } = currentSchema
    const steps = getStepsFromSchema(schema)

    steps.push(createStep({
      schema: {
        title: 'Files'
      },
      state: {
        binary: undefined,
        code: undefined
      },

      type: 'Data',
      index: steps.length,
      section: 'files',

      render: renderFileTab
    }))

    setSteps(steps)
  }, [currentSchema])

  if (isDefaultSchemaLoading || isSchemasLoading) {
    return <></>
  }

  const onSubmit = async () => {
    setError(undefined)

    const data = getStepsData(steps)
    const form = new FormData()

    console.log('data', data)
    console.log('steps', steps)

    data.schemaRef = currentSchema?.reference

    form.append('code', data.files.code)
    form.append('binary', data.files.binary)

    delete data.files

    form.append('metadata', JSON.stringify(data))

    const upload = await fetch('/api/v1/model', {
      method: 'POST',
      body: form,
    })

    if (upload.status >= 400) {
      let error = upload.statusText
      try {
        error = `${upload.statusText}: ${(await upload.json()).message}`
      } catch(e) {}

      return setError(error)
    }
    
    const { uuid } = await upload.json()
    router.push(`/model/${uuid}`)
  }

  return (
    <Paper variant='outlined' sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
      <Grid container justifyContent='space-between' alignItems='center'>
        <Box />
        <SchemaSelector currentSchema={currentSchema || defaultSchema!} setCurrentSchema={setCurrentSchema} schemas={schemas} />
      </Grid>

      <SubmissionError error={error} />
      <Form
        steps={steps}
        setSteps={setSteps}
        onSubmit={onSubmit}
      />
    </Paper>
  )
}

export default function Outer() {
  return (
    <Wrapper title={'Upload Model'} page={'upload'}>
      <Upload />
    </Wrapper>
  )
}