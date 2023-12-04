import { ArrowBack, FileUpload } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, Button, Container, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { postSchema, SchemaKind } from 'actions/schema'
import { useRouter } from 'next/router'
import { useState } from 'react'
import RichTextEditor from 'src/common/RichTextEditor'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import Wrapper from 'src/Wrapper.beta'
import { getErrorMessage } from 'utils/fetcher'

export default function NewSchema() {
  const [jsonSchema, setJsonSchema] = useState('')
  const [schemaId, setSchemaId] = useState('')
  const [schemaDescription, setSchemaDescription] = useState('')
  const [schemaName, setSchemaName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [schemaKind, setSchemaKind] = useState<SchemaKind>(SchemaKind.MODEL)
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

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

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)
    if (!jsonSchema) {
      setErrorMessage('Please select a schema')
      setLoading(false)
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
        setLoading(false)
        return setErrorMessage(error)
      }

      router.push('/beta/schemas/list')
    } catch (e) {
      if (e instanceof SyntaxError) {
        setErrorMessage('Unable to parse JSON. Please make sure the file you have used is valid JSON.')
        setLoading(false)
      } else {
        setErrorMessage('There was a problem submitting this form. Please try again later.')
      }
    }
  }

  return (
    <Wrapper title='Upload a new Schema' page='upload'>
      <Container maxWidth='sm'>
        <Paper sx={{ p: 4, m: 'auto' }}>
          <Link href={`/beta/schemas/list`}>
            <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
              Back to schema list
            </Button>
          </Link>
          <Stack spacing={2} alignItems='center' justifyContent='center' sx={{ mt: 2 }}>
            <Typography variant='h6' component='h1' color='primary'>
              Upload a new Schema
            </Typography>
            <FileUpload color='primary' fontSize='large' />
            <Typography>Schemas are used to construct both model and access request forms.</Typography>
          </Stack>
          <Box onSubmit={handleSubmit} component='form'>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Stack>
                <Typography fontWeight='bold'>
                  Id <span style={{ color: 'red' }}>*</span>
                </Typography>
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
                <Typography fontWeight='bold'>
                  Name <span style={{ color: 'red' }}>*</span>
                </Typography>
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
                <Typography fontWeight='bold'>
                  Description <span style={{ color: 'red' }}>*</span>
                </Typography>
                <RichTextEditor
                  value={schemaDescription}
                  onChange={(input) => setSchemaDescription(input)}
                  aria-label='Schema description'
                />
                <Typography variant='caption'>A short description describing the purpose of this schema</Typography>
              </Stack>
              <Stack>
                <Typography fontWeight='bold'>
                  Schema Type <span style={{ color: 'red' }}>*</span>
                </Typography>
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
              <Stack alignItems='flex-end'>
                <LoadingButton
                  variant='contained'
                  loading={loading}
                  type='submit'
                  disabled={!schemaId || !schemaName || !schemaDescription || !jsonSchema}
                  sx={{ width: 'fit-content' }}
                >
                  Upload schema
                </LoadingButton>
                <MessageAlert message={errorMessage} severity='error' />
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Wrapper>
  )
}
