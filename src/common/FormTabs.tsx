import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import { useEffect, useState } from 'react'
import FormFlow from './FormFlow'
import cloneDeep from 'lodash/cloneDeep'

export default function FormTabs({
  defaultSchema,
  schemas,
  onSubmit,
  name,
  UploadForm,
  omitFields,
  error,
  mode,
  modelToEdit,
}: {
  defaultSchema: any
  schemas: any
  onSubmit: any
  name: any
  UploadForm: any
  omitFields: any
  error?: any
  mode?: any
  modelToEdit?: any
}) {
  const [selectedSchema, setSelectedSchema] = useState(defaultSchema)
  const [tab, setTab] = useState('generate')
  const [uiSchema, setUiSchema] = useState({})
  const [updatedSelectedSchema, setUpdatedSelectedSchema] = useState<any>(undefined)

  useEffect(() => {
    if (modelToEdit !== undefined) {
      const schema = schemas.find((cur: any) => cur.reference === modelToEdit.metadata.schemaRef)
      setSelectedSchema(schema)
    }
  }, [modelToEdit])

  const onSchemaChange = (event: any) => {
    const schema = schemas.find((cur: any) => cur.name === event.target.value)
    setSelectedSchema(schema)
  }

  const formatUiWidgets = () => {
    const formattedUiSchema = {
      contacts: {
        requester: { 'ui:widget': 'userSelector' },
        secondPOC: { 'ui:widget': 'userSelector' },
        uploader: { 'ui:widget': 'userSelector' },
        reviewer: { 'ui:widget': 'userSelector' },
        manager: { 'ui:widget': 'userSelector' },
      },
    }

    setUiSchema(formattedUiSchema)
  }

  const onTabChange = (_event: any, newValue: any) => {
    setTab(newValue)
  }

  useEffect(() => {
    formatUiWidgets()
    if (mode === 'edit') {
      let updatedSchema = cloneDeep(selectedSchema)
      // Version and name should be disabled in edit mode
      updatedSchema.schema.properties.highLevelDetails.properties.name.readOnly = true
      updatedSchema.schema.properties.highLevelDetails.properties.modelCardVersion.readOnly = true
      setUpdatedSelectedSchema(updatedSchema)
    }
    if (mode === 'newVersion') {
      let updatedSchema = cloneDeep(selectedSchema)
      // Name should be disabled in edit and new version
      updatedSchema.schema.properties.highLevelDetails.properties.name.readOnly = true
      setUpdatedSelectedSchema(updatedSchema)
    }
    if (mode === undefined) {
      setUpdatedSelectedSchema(selectedSchema)
    }
  }, [selectedSchema])

  return (
    <>
      {updatedSelectedSchema !== undefined && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Grid container justifyContent='space-between' alignItems='center'>
              <Stack direction='row' spacing={2}></Stack>
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel id='schema-label'>Schema</InputLabel>
                <Select
                  labelId='schema-label'
                  id='schema'
                  value={updatedSelectedSchema.name}
                  label='Schema'
                  onChange={onSchemaChange}
                  disabled={mode === 'edit' || mode === 'newVersion'}
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
              <Tab label={'Create ' + name} value='generate' />
              <Tab label={'Upload ' + name} value='upload' data-test='uploadJsonTab' />
            </Tabs>
          </Box>

          {tab === 'generate' && (
            <>
              <Box sx={{ py: 2 }} />
              <FormFlow
                name={name}
                schema={updatedSelectedSchema}
                uiSchema={uiSchema}
                onSubmit={onSubmit}
                omitFields={omitFields}
                mode={mode}
                modelToEdit={modelToEdit}
              />
            </>
          )}

          {tab === 'upload' && (
            <>
              {error && (
                <>
                  <Box sx={{ py: 2 }} />
                  <Alert severity='error' sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                </>
              )}
              <Box sx={{ py: 2 }} />
              <UploadForm onSubmit={onSubmit} schema={updatedSelectedSchema} />
            </>
          )}
        </>
      )}
    </>
  )
}
