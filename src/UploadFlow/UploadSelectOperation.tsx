import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import MenuItem from '@mui/material/MenuItem'
import { useRouter } from 'next/router'
import { useState } from 'react'
import UploadForm from 'src/UploadForm'
import UploadFile from './UploadFile'

export default function UploadSelectOperation({
  defaultSchema,
  schemas,
  models: _models,
}: {
  defaultSchema: any
  schemas: any
  models: any
}) {
  const router = useRouter()

  const [selectedSchema, setSelectedSchema] = useState(defaultSchema)
  const [tab, setTab] = useState('generate')

  const onSchemaChange = (event: any) => {
    const schema = schemas.find((cur: any) => cur.name === event.target.value)
    setSelectedSchema(schema)
  }

  const onTabChange = (_event: any, newValue: any) => {
    setTab(newValue)
  }

  const onUpload = async (codeFile: any, binaryFile: any, metadata: any) => {
    const form = new FormData()

    for (const meta of ['required', '$schema', 'definitions', 'type', 'properties']) {
      delete metadata[meta]
    }

    metadata.schemaRef = selectedSchema.reference

    form.append('code', codeFile)
    form.append('binary', binaryFile)
    form.append('metadata', JSON.stringify(metadata))

    const upload = await fetch('/api/v1/model', {
      method: 'POST',
      body: form,
    }).then((res) => res.json())

    const { uuid } = upload

    if (uuid) {
      router.push(`/model/${uuid}`)
    }
  }

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Grid container justifyContent='space-between' alignItems='center'>
          <Stack direction='row' spacing={2}></Stack>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel id='schema-label'>Schema</InputLabel>
            <Select
              labelId='schema-label'
              id='schema'
              value={selectedSchema.name}
              label='Schema'
              onChange={onSchemaChange}
            >
              {schemas.map((schema: any, index: number) => (
                <MenuItem key={`item-${index}`} value={schema.name}>
                  {schema.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Tabs indicatorColor='secondary' value={tab} onChange={onTabChange}>
          <Tab label='Generate Model Card' value='generate' />
          <Tab label='Upload Model Card' value='upload' />
        </Tabs>
      </Box>

      {tab === 'generate' && (
        <>
          <UploadForm schema={selectedSchema} onUpload={onUpload} />
        </>
      )}

      {tab === 'upload' && (
        <>
          <Box sx={{ py: 2 }} />
          <UploadFile onSubmit={onUpload} schema={selectedSchema} />
        </>
      )}
    </>
  )
}
