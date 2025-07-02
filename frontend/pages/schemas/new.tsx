import { ArrowBack, Schema } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useGetReviewRoles } from 'actions/reviewRoles'
import { postSchema } from 'actions/schema'
import { useRouter } from 'next/router'
import { ChangeEvent, FormEvent, SyntheticEvent, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import RichTextEditor from 'src/common/RichTextEditor'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { ReviewRoleInterface, SchemaKind, SchemaKindKeys } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { camelCaseToSentenceCase, camelCaseToTitleCase } from 'utils/stringUtils'

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
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [newReviewRoles, setNewReviewRoles] = useState<ReviewRoleInterface[]>([])

  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles()

  const router = useRouter()
  const theme = useTheme()

  const schemaTypeOptions = useMemo(
    () =>
      Object.values(SchemaKind).map((schemaKind) => (
        <MenuItem value={schemaKind} key={schemaKind}>
          {camelCaseToTitleCase(schemaKind)}
        </MenuItem>
      )),
    [],
  )

  const schemaTypeDescription = useMemo(() => {
    const schemaKinds = Object.values(SchemaKind).map((schemaKind) =>
      schemaKind === SchemaKind.MODEL
        ? `${camelCaseToSentenceCase(schemaKind)} Card`
        : camelCaseToSentenceCase(schemaKind),
    )
    const last = schemaKinds.pop()
    return `Schemas are used for ${schemaKinds.join(', ')} and ${last} forms`
  }, [])

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    if (event.target.files !== null && event.target.files[0]) {
      const fileToUpload = event.target.files[0]
      fileReader.readAsText(fileToUpload, 'UTF-8')
      fileReader.onload = (onloadEvent) => {
        if (onloadEvent?.target?.result) {
          setFileName(fileToUpload.name)
          setJsonSchema(onloadEvent.target.result.toString())
        }
      }
    }
  }

  const handleReviewRolesOnChange = (_event: SyntheticEvent<Element, Event>, newValue: ReviewRoleInterface[]) => {
    setNewReviewRoles(newValue)
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
          reviewRoles: newReviewRoles.map((role) => role.short),
        })

        if (!response.ok) {
          setLoading(false)
          // Check for 403 errors that do not have a body
          if (response.status === 403) {
            return setErrorMessage('403: You do not have the necessary permissions to make this action.')
          }
          // Otherwise we check for regular errors
          const error = await getErrorMessage(response)
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

  const error = MultipleErrorWrapper(`Unable to load new schema page`, {
    isReviewRolesError,
  })
  if (error) return error

  if (isReviewRolesLoading) {
    return <Loading />
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
              <Stack direction='row' spacing={2}>
                <Stack>
                  <Typography fontWeight='bold'>
                    Id <span style={{ color: theme.palette.error.main }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    size='small'
                    value={schemaId}
                    aria-label='Schema ID'
                    onChange={(e) => setSchemaId(e.target.value)}
                    slotProps={{
                      htmlInput: { autoFocus: true },
                    }}
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
              <Autocomplete
                multiple
                size='small'
                options={reviewRoles}
                onChange={handleReviewRolesOnChange}
                getOptionLabel={(option: ReviewRoleInterface) => option.name}
                value={newReviewRoles || []}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Select an option below'
                    size='small'
                    placeholder={reviewRoles.length ? undefined : 'Unanswered'}
                  />
                )}
              />
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
                  {schemaTypeOptions}
                </Select>
                <Typography variant='caption'>{schemaTypeDescription}</Typography>
              </Stack>
              <Button variant='outlined' component='label' aria-label='Schema JSON file upload button'>
                {fileName !== '' ? fileName : 'Select schema'}
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
