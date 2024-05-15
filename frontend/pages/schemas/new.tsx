import { ArrowBack, Schema } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, Button, Container, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { postSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import { ChangeEvent, FormEvent, useState } from 'react'
import RichTextEditor from 'src/common/RichTextEditor'
import Title from 'src/common/Title'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { SchemaKind, SchemaKindKeys } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

export default function NewSchema() {
  const [jsonSchema, setJsonSchema] = useState('')
  const [schemaId, setSchemaId] = useState('')
  const [schemaDescription, setSchemaDescription] = useState('')
  const [schemaName, setSchemaName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [schemaKind, setSchemaKind] = useState<SchemaKindKeys>(SchemaKind.MODEL)
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const theme = useTheme()

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    if (event.target.files !== null && event.target.files[0]) {
      const fileToUpload = event.target.files[0]
      fileReader.readAsText(fileToUpload, 'UTF-8')
      fileReader.onload = (onloadEvent) => {
        if (onloadEvent?.target?.result) {
          setFilename(fileToUpload.name)
          setJsonSchema(onloadEvent.target.result.toString())
        }
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    if (event) {
      event.preventDefault()
      setErrorMessage('')

      if (!jsonSchema) {
        setErrorMessage('Please select a schema')
        return
      }
      setLoading(true)
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

        router.push('/schemas/list')
      } catch (e) {
        if (e instanceof SyntaxError) {
          setErrorMessage('Unable to parse JSON. Please make sure the file you have used is valid JSON.')
          setLoading(false)
        } else {
          setErrorMessage('There was a problem submitting this form. Please contact Bailo support')
        }
      }
    }
  }

  return (
    <>
      <Title text='Upload a new Schema' />
      <Container maxWidth='sm' sx={{ my: 4 }}>
        <Paper sx={{ p: 4, m: 'auto' }}>
          <Link href={`/schemas/list`}>
            <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
              Back to schema list
            </Button>
          </Link>
          <Stack spacing={2} alignItems='center' justifyContent='center' sx={{ mt: 2 }}>
            <Typography variant='h6' component='h1' color='primary'>
              Upload a new Schema
            </Typography>
            <Schema color='primary' fontSize='large' />
            <Typography>Schemas are used to construct both model and access request forms.</Typography>
          </Stack>
          <Box onSubmit={handleSubmit} component='form'>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Stack>
                <Typography fontWeight='bold'>
                  Id <span style={{ color: theme.palette.error.main }}>*</span>
                </Typography>
                <TextField
                  inputProps={{ autoFocus: true }}
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
                  Name <span style={{ color: theme.palette.error.main }}>*</span>
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
                  Description <span style={{ color: theme.palette.error.main }}>*</span>
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
                  Schema Type <span style={{ color: theme.palette.error.main }}>*</span>
                </Typography>
                <Select
                  size='small'
                  required
                  value={schemaKind}
                  onChange={(e) => setSchemaKind(e.target.value as SchemaKindKeys)}
                >
                  <MenuItem value={SchemaKind.MODEL}>Model</MenuItem>
                  <MenuItem value={SchemaKind.ACCESS_REQUEST}>Access Request</MenuItem>
                </Select>
                <Typography variant='caption'>
                  Schemas are used for both model cards and access request forms
                </Typography>
              </Stack>
              <Button variant='outlined' component='label' aria-label='Schema JSON file upload button'>
                {filename !== '' ? filename : 'Select schema'}
                <VisuallyHiddenInput type='file' onChange={handleUploadChange} />
              </Button>
              <Stack alignItems='flex-end'>
                <LoadingButton
                  variant='contained'
                  loading={loading}
                  type='submit'
                  disabled={!schemaId || !schemaName || !schemaDescription || !jsonSchema}
                >
                  Upload schema
                </LoadingButton>
                <MessageAlert message={errorMessage} severity='error' />
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </>
  )
}
