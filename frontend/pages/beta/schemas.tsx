import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { postSchema, SchemaKind, useGetSchemas } from 'actions/schema'
import { useState } from 'react'
import PageWithTabs from 'src/common/PageWithTabs'
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
  }

  function clearFormData() {
    setJsonSchema('')
    setSchemaId('')
    setSchemaName('')
    setSchemaDescription('')
    setSchemaKind(SchemaKind.MODEL)
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
      <Dialog open={open}>
        <Box component='form' onSubmit={onSubmit}>
          <DialogTitle color='primary'>Upload a new schema</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Stack>
                <Typography fontWeight='bold'>Id</Typography>
                <Typography variant='caption'>Please specify a unique ID for your schema</Typography>
                <TextField
                  fullWidth
                  size='small'
                  value={schemaId}
                  onChange={(e) => setSchemaId(e.target.value)}
                ></TextField>
              </Stack>
              <Stack>
                <Typography fontWeight='bold'>Name</Typography>
                <Typography variant='caption'>Please specify a name for your schema</Typography>
                <TextField
                  fullWidth
                  size='small'
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                ></TextField>
              </Stack>
              <Stack>
                <Typography fontWeight='bold'>Description</Typography>
                <Typography variant='caption'>A short description describing the purpose of this schema</Typography>
                <TextField
                  fullWidth
                  size='small'
                  value={schemaDescription}
                  onChange={(e) => setSchemaDescription(e.target.value)}
                ></TextField>
              </Stack>
              <Stack>
                <Typography fontWeight='bold'>Schema Type</Typography>
                <Typography variant='caption'>
                  Schemas are used for both model cards and access request forms
                </Typography>
                <TextField
                  select
                  size='small'
                  value={schemaKind}
                  onChange={(event): void => setSchemaKind(event.target.value as SchemaKind)}
                >
                  <MenuItem value={SchemaKind.MODEL}>Model</MenuItem>
                  <MenuItem value={SchemaKind.ACCESS}>Access Request</MenuItem>
                </TextField>
              </Stack>
              <Button variant='outlined' component='label'>
                {filename !== '' ? filename : 'Select schema'}
                <input type='file' hidden onChange={handleUploadChange} />
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ pr: 2 }}>
            <Stack>
              <Button type='submit'>Submit</Button>
              <Typography variant='caption' color={theme.palette.error.main}>
                {errorMessage}
              </Typography>
            </Stack>
          </DialogActions>
        </Box>
      </Dialog>
    </Wrapper>
  )
}
