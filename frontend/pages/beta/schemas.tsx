import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { postSchema, SchemaKind, useGetSchemas } from 'actions/schema'
import { useState } from 'react'
import PageWithTabs from 'src/common/PageWithTabs'
import RichTextEditor from 'src/common/RichTextEditor'
import SchemaTab from 'src/schemas/SchemaTab'
import Wrapper from 'src/Wrapper.beta'
import { getErrorMessage } from 'utils/fetcher'

export default function Schemas() {
  const theme = useTheme()

  const { mutateSchemas: mutateModelSchemas } = useGetSchemas('model')
  const { mutateSchemas: mutateAccessRequestSchemas } = useGetSchemas('accessRequest')

  const [open, setOpen] = useState(false)
  const [jsonSchema, setJsonSchema] = useState('')
  const [schemaId, setSchemaId] = useState('')
  const [schemaDescription, setSchemaDescription] = useState('')
  const [schemaName, setSchemaName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [schemaKind, setSchemaKind] = useState<SchemaKind>(SchemaKind.MODEL)
  const [filename, setFilename] = useState('')

  const handleUploadChange = (event) => {
    const fileReader = new FileReader()
    fileReader.readAsText(event.target.files[0], 'UTF-8')
    fileReader.onload = (onloadEvent) => {
      if (onloadEvent?.target?.result !== undefined && onloadEvent?.target?.result !== null) {
        setFilename(event.target.files[0].name)
        setJsonSchema(onloadEvent.target.result.toString())
      }
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    if (!jsonSchema) {
      setErrorMessage('Please select a schema')
      return
    }
    try {
      const response = await postSchema({
        id: schemaId,
        name: schemaName,
        description: schemaDescription,
        kind: schemaKind,
        jsonSchema: JSON.parse(jsonSchema),
      })

      if (!response.ok) {
        const error = await getErrorMessage(response)
        return setErrorMessage(error)
      }

      mutateModelSchemas()
      mutateAccessRequestSchemas()
      clearFormData()
      setOpen(false)
    } catch (e: any) {
      if (e.name == 'SyntaxError') {
        setErrorMessage('Unable to parse JSON. Please make sure the file you have used is valid JSON.')
      }
    }
  }

  function clearFormData() {
    setJsonSchema('')
    setSchemaId('')
    setSchemaName('')
    setSchemaDescription('')
    setSchemaKind(SchemaKind.MODEL)
  }

  function handleClose() {
    setErrorMessage('')
    setOpen(false)
    clearFormData()
  }

  return (
    <Wrapper title='Schemas' page='schemas' fullWidth>
      <PageWithTabs
        title='Schemas'
        tabs={[
          { title: 'Schemas', path: 'overview', view: <SchemaTab /> },
          { title: 'Designer (beta)', path: 'releases', view: <></>, disabled: true },
        ]}
        displayActionButton
        actionButtonTitle='Upload a new schema'
        actionButtonOnClick={() => setOpen(true)}
      />
      <Dialog open={open} onClose={handleClose} sx={{ mt: 2 }}>
        <Box component='form' onSubmit={onSubmit}>
          <DialogTitle color='primary'>Upload a new schema</DialogTitle>
          <DialogContent sx={{ pb: 0 }}>
            <FormControl />
            <Stack spacing={2}>
              <Stack>
                <Typography fontWeight='bold'>Id *</Typography>
                <TextField
                  fullWidth
                  required
                  size='small'
                  value={schemaId}
                  aria-label='Schema ID'
                  onChange={(e) => setSchemaId(e.target.value)}
                />
                <Typography variant='caption'>Please specify a unique ID for your schema</Typography>
              </Stack>
              <Stack>
                <Typography fontWeight='bold'>Name *</Typography>
                <TextField
                  fullWidth
                  required
                  size='small'
                  value={schemaName}
                  aria-label='Schema name'
                  onChange={(e) => setSchemaName(e.target.value)}
                />
                <Typography variant='caption'>Please specify a name for your schema</Typography>
              </Stack>
              <Stack>
                <Typography fontWeight='bold'>Description *</Typography>
                <RichTextEditor
                  value={schemaDescription}
                  onChange={(input) => setSchemaDescription(input)}
                  aria-label='Schema description'
                />
                <Typography variant='caption'>A short description describing the purpose of this schema</Typography>
              </Stack>
              <Stack>
                <Typography fontWeight='bold'>Schema Type *</Typography>
                <TextField
                  select
                  size='small'
                  required
                  value={schemaKind}
                  onChange={(event): void => setSchemaKind(event.target.value as SchemaKind)}
                >
                  <MenuItem value={SchemaKind.MODEL}>Model</MenuItem>
                  <MenuItem value={SchemaKind.ACCESS}>Access Request</MenuItem>
                </TextField>
                <Typography variant='caption'>
                  Schemas are used for both model cards and access request forms
                </Typography>
              </Stack>
              <Button variant='outlined' component='label' aria-label='Schema JSON file upload button'>
                {filename !== '' ? filename : 'Select schema'}
                <input type='file' hidden onChange={handleUploadChange} />
              </Button>
              <Typography variant='caption' color={theme.palette.error.main}>
                {errorMessage}
              </Typography>
            </Stack>
            <FormControl />
          </DialogContent>
          <DialogActions sx={{ pr: 2 }}>
            <Button onClick={handleClose} variant='outlined'>
              Cancel
            </Button>
            <Button type='submit' variant='contained'>
              Submit
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Wrapper>
  )
}
